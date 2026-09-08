// Lightweight TF-IDF retrieval engine.
// No external embedding API required — this keeps the RAG pipeline
// self-contained and free to run. Swap this out for a real vector
// database later if the knowledge base grows large.

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "and", "or", "but", "if", "then", "so", "to", "of", "in", "on", "for",
  "with", "at", "by", "from", "as", "it", "this", "that", "these", "those",
  "i", "you", "he", "she", "we", "they", "do", "does", "did", "can", "could",
  "will", "would", "should", "about", "what", "which", "who", "whom", "how",
  "me", "my", "your", "their", "our", "us", "am", "not", "no", "yes"
]);

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

class TfIdfIndex {
  constructor(documents) {
    // documents: [{ id, text }]
    this.documents = documents;
    this._build();
  }

  _build() {
    const tokenizedDocs = this.documents.map((d) => tokenize(d.text));
    const df = new Map();

    tokenizedDocs.forEach((tokens) => {
      new Set(tokens).forEach((t) => df.set(t, (df.get(t) || 0) + 1));
    });

    const N = this.documents.length;
    this.idf = new Map();
    df.forEach((count, term) => {
      this.idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
    });

    this.docVectors = tokenizedDocs.map((tokens, i) => {
      const tf = new Map();
      tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));

      const vector = new Map();
      let normSq = 0;
      tf.forEach((count, term) => {
        const idf = this.idf.get(term) || 0;
        const weight = (count / (tokens.length || 1)) * idf;
        vector.set(term, weight);
        normSq += weight * weight;
      });

      return {
        id: this.documents[i].id,
        vector,
        norm: Math.sqrt(normSq) || 1,
      };
    });
  }

  query(text, topK = 4) {
    const tokens = tokenize(text);
    const tf = new Map();
    tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));

    const qVector = new Map();
    let qNormSq = 0;
    tf.forEach((count, term) => {
      const idf = this.idf.get(term);
      if (!idf) return; // ignore terms never seen in the knowledge base
      const weight = (count / (tokens.length || 1)) * idf;
      qVector.set(term, weight);
      qNormSq += weight * weight;
    });
    const qNorm = Math.sqrt(qNormSq) || 1;

    const scores = this.docVectors.map((dv) => {
      let dot = 0;
      qVector.forEach((w, term) => {
        const dw = dv.vector.get(term);
        if (dw) dot += w * dw;
      });
      return { id: dv.id, score: dot / (qNorm * dv.norm) };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK).filter((s) => s.score > 0);
  }
}

module.exports = { tokenize, TfIdfIndex };
