/**
 * Auto-Tagging Service
 * Automatically categorizes queries based on content analysis
 * Uses keyword matching and natural language processing
 */

const natural = require('natural');

// Initialize tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

/**
 * Tag keywords mapping - maps keywords to their respective tags
 */
const TAG_KEYWORDS = {
  question: ['question', 'ask', 'wonder', 'curious', 'how', 'what', 'why', 'when', 'where', 'who', '?'],
  request: ['request', 'please', 'need', 'want', 'require', 'would like', 'could you', 'can you', 'help me'],
  complaint: ['complaint', 'complaining', 'unhappy', 'dissatisfied', 'disappointed', 'angry', 'frustrated', 'problem', 'issue', 'wrong', 'bad', 'terrible', 'awful', 'horrible'],
  compliment: ['compliment', 'thank', 'thanks', 'appreciate', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'fantastic', 'brilliant'],
  feedback: ['feedback', 'suggest', 'suggestion', 'improve', 'improvement', 'idea', 'opinion', 'think'],
  technical_issue: ['error', 'bug', 'broken', 'not working', 'crash', 'technical', 'glitch', 'malfunction', 'defect', 'fault'],
  billing: ['billing', 'payment', 'charge', 'invoice', 'bill', 'refund', 'money', 'cost', 'price', 'subscription', 'renewal']
};

/**
 * Analyzes query content and returns detected tags
 * @param {string} subject - Query subject
 * @param {string} content - Query content
 * @returns {Object} - Object containing tags array and primaryTag
 */
function analyzeAndTag(subject, content) {
  const combinedText = `${subject} ${content}`.toLowerCase();
  const tokens = tokenizer.tokenize(combinedText);
  const stemmedTokens = tokens.map(token => stemmer.stem(token));
  
  const tagScores = {};
  const detectedTags = [];
  
  // Initialize tag scores
  Object.keys(TAG_KEYWORDS).forEach(tag => {
    tagScores[tag] = 0;
  });
  
  // Score each tag based on keyword matches
  Object.keys(TAG_KEYWORDS).forEach(tag => {
    TAG_KEYWORDS[tag].forEach(keyword => {
      const stemmedKeyword = stemmer.stem(keyword);
      
      // Check for exact matches in tokens
      if (stemmedTokens.includes(stemmedKeyword)) {
        tagScores[tag] += 2;
      }
      
      // Check for partial matches in combined text
      if (combinedText.includes(keyword)) {
        tagScores[tag] += 1;
      }
    });
  });
  
  // Determine primary tag (highest score)
  let maxScore = 0;
  let primaryTag = 'other';
  
  Object.keys(tagScores).forEach(tag => {
    if (tagScores[tag] > maxScore) {
      maxScore = tagScores[tag];
      primaryTag = tag;
    }
    
    // Add tag to detected tags if score is above threshold
    if (tagScores[tag] > 0) {
      detectedTags.push(tag);
    }
  });
  
  // If no tags detected, default to 'other'
  if (detectedTags.length === 0) {
    detectedTags.push('other');
    primaryTag = 'other';
  }
  
  // Remove duplicates
  const uniqueTags = [...new Set(detectedTags)];
  
  return {
    tags: uniqueTags,
    primaryTag: primaryTag,
    scores: tagScores
  };
}

/**
 * Updates query with auto-detected tags
 * @param {Object} query - Mongoose query document
 * @returns {Promise<Object>} - Updated query document
 */
async function applyTagsToQuery(query) {
  const taggingResult = analyzeAndTag(query.subject, query.content);
  
  query.tags = taggingResult.tags;
  query.primaryTag = taggingResult.primaryTag;
  
  // Log tagging in history
  query.history.push({
    action: 'Auto-tagged',
    performedBy: null, // System action
    notes: `Tags: ${taggingResult.tags.join(', ')}, Primary: ${taggingResult.primaryTag}`
  });
  
  return query.save();
}

module.exports = {
  analyzeAndTag,
  applyTagsToQuery
};


