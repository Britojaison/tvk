// Candidate details — easy to find and replace
export const CANDIDATE_NAME = "Vipin";
export const CANDIDATE_NAME_TAMIL = "விபின்";
export const CANDIDATE_CONSTITUENCY = "Anangulam Constituency";
export const CANDIDATE_CONSTITUENCY_TAMIL = "அனங்குளம் தொகுதி";

// Party details
export const PARTY_NAME = "தமிழக வெற்றி கழகம்";
export const PARTY_NAME_ENGLISH = "Tamil Nadu Elections 2026";
export const PARTY_ACRONYM = "TVK";
export const ELECTION_YEAR = "2026";

// Image paths
export const IMAGES = {
  logo: "/logo.jpg",
  campaignBase: "/selfie.png", // Base image with Vijay and Vipin
  // Fallbacks for avatars (since original files were removed)
  vijay: "/selfie.png",
  candidate: "/selfie.png",
} as const;

// Share messages
export const WHATSAPP_MESSAGE = `🔴 நான் ${PARTY_ACRONYM} உடன்! | I'm with ${PARTY_ACRONYM}! 🔴

✊ ${CANDIDATE_NAME} - ${CANDIDATE_CONSTITUENCY} வேட்பாளர்
🌟 தலைவர் விஜய் அவர்களுடன் நான்!

வாக்களியுங்கள் ${PARTY_ACRONYM} 🗳️

#TVK #VijayThalapathy #TamilagaVettriKazhagam #TamilNaduElections2026 #${CANDIDATE_NAME.replace(/\s/g, "")}`;

// Status messages for generation
export const STATUS_MESSAGES = [
  { tamil: "📸 புகைப்படம் எடுக்கிறோம்...", english: "Capturing photo..." },
  { tamil: "🎬 விஜய் மற்றும் வேட்பாளருடன் சேர்க்கிறோம்...", english: "Placing with Vijay and Vipin..." },
  { tamil: "✨ பிரச்சார மேஜிக் சேர்க்கிறோம்...", english: "Adding campaign magic..." },
  { tamil: "🎨 வண்ணங்கள் சரிசெய்கிறோம்...", english: "Color grading..." },
  { tamil: "✅ கிட்டத்தட்ட தயார்!", english: "Almost ready!" },
];
