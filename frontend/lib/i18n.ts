/** Lightweight i18n strings for PaperTrail AI UI. */

export type SupportedLang = "en" | "ta" | "hi";

const strings = {
  en: {
    appName: "PaperTrail AI",
    tagline: "Your Bureaucracy Navigator",
    heroTitle: "How can I help you today?",
    heroSubtitle:
      "Tell me about your situation and I'll identify every government procedure you need, generate the forms, and guide you step by step.",
    inputPlaceholderFirst:
      "Tell me what happened... (e.g., 'My grandfather passed away in Chennai')",
    inputPlaceholder: "Type your response...",
    send: "Send",
    enterToSend: "Press Enter to send · Shift+Enter for new line",
    startCase: "Start a Case",
    caseDashboard: "Case Dashboard",
    overallProgress: "Overall Progress",
    estimatedDays: "Estimated Days",
    totalFees: "Total Fees",
    procedures: "Procedures",
    continueInChat: "Continue in Chat",
    retry: "Retry",
    loading: "Loading...",
    errorServer:
      "Sorry, there was an error connecting to the server. Please make sure the backend is running.",
    errorLoadCase:
      "Could not load case data. Make sure the backend is running.",
    noCaseData: "No case data found",
    withNyayaMitra: "With PaperTrail AI",
    withoutHelp: "Without help",
    yourProcedurePlan: "Your Procedure Plan",
    generateForm: "Generate Form",
    navigate: "Navigate",
    escalate: "Escalate",
    downloadPdf: "Download PDF",
    documentsChecklist: "Documents Checklist",
    whatToSay: "What to say",
    proTips: "Pro Tips (if they push back)",
    rtiReady: "RTI Application Ready",
    howToSubmit: "How to submit",
    // Step Guide
    guide_step1_title: "Describe what happened",
    guide_step1_body: "Type or speak your situation in any language",
    guide_step2_title: "Analyzing your situation",
    guide_step2_body: "6 AI agents are working to identify what you need",
    guide_step3_title: "Your action plan is ready",
    guide_step3_body: "Click any procedure card on the right to get started",
    guide_step4_title: "3 tabs inside each procedure",
    guide_step4_body: "Documents → Navigate → Escalate",
    guide_step5_title: "Download your pre-filled form",
    guide_step5_body: "Already filled with your details — just print and sign",
    guide_step6_title: "Get your complete document kit",
    guide_step6_body: "One PDF with all forms, checklists, and instructions",
    guide_dismiss: "Got it",
    guide_next: "Next tip",
  },
  ta: {
    appName: "PaperTrail AI",
    tagline: "உங்கள் அரசு வழிகாட்டி",
    heroTitle: "இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
    heroSubtitle:
      "உங்கள் நிலையை என்னிடம் கூறுங்கள், தேவையான ஒவ்வொரு அரசு நடைமுறையையும் கண்டறிந்து, படிவங்களை உருவாக்கி, படிப்படியாக வழிநடத்துவேன்.",
    inputPlaceholderFirst:
      "என்ன நடந்தது என்று சொல்லுங்கள்... (எ.கா., 'என் தாத்தா சென்னையில் இறந்துவிட்டார்')",
    inputPlaceholder: "உங்கள் பதிலை தட்டச்சு செய்யுங்கள்...",
    send: "அனுப்பு",
    enterToSend: "அனுப்ப Enter · புதிய வரி Shift+Enter",
    startCase: "ஒரு வழக்கைத் தொடங்குங்கள்",
    caseDashboard: "வழக்கு டாஷ்போர்ட்",
    overallProgress: "மொத்த முன்னேற்றம்",
    estimatedDays: "மதிப்பிடப்பட்ட நாட்கள்",
    totalFees: "மொத்த கட்டணம்",
    procedures: "நடைமுறைகள்",
    continueInChat: "அரட்டையில் தொடரவும்",
    retry: "மீண்டும் முயற்சிக்கவும்",
    loading: "ஏற்றுகிறது...",
    errorServer:
      "மன்னிக்கவும், சேவையகத்துடன் இணைப்பதில் பிழை. பின்தளம் இயங்குவதை உறுதிப்படுத்தவும்.",
    errorLoadCase:
      "வழக்குத் தரவை ஏற்ற இயலவில்லை. பின்தளம் இயங்குவதை உறுதிப்படுத்தவும்.",
    noCaseData: "வழக்குத் தரவு இல்லை",
    withNyayaMitra: "PaperTrail AI உடன்",
    withoutHelp: "உதவி இல்லாமல்",
    yourProcedurePlan: "உங்கள் நடைமுறை திட்டம்",
    generateForm: "படிவம் உருவாக்கு",
    navigate: "வழிகாட்டு",
    escalate: "முறையிடு",
    downloadPdf: "PDF பதிவிறக்கு",
    documentsChecklist: "ஆவணங்கள் சரிபார்ப்பு",
    whatToSay: "என்ன சொல்வது",
    proTips: "குறிப்புகள் (அவர்கள் மறுத்தால்)",
    rtiReady: "RTI விண்ணப்பம் தயார்",
    howToSubmit: "எவ்வாறு சமர்ப்பிப்பது",
    // Step Guide
    guide_step1_title: "என்ன நடந்தது என்று சொல்லுங்கள்",
    guide_step1_body: "எந்த மொழியிலும் உங்கள் நிலையை தட்டச்சு செய்யுங்கள்",
    guide_step2_title: "உங்கள் நிலை பகுப்பாய்வு செய்யப்படுகிறது",
    guide_step2_body: "6 AI முகவர்கள் உங்களுக்குத் தேவையானவற்றை கண்டறிகின்றனர்",
    guide_step3_title: "உங்கள் செயல் திட்டம் தயார்",
    guide_step3_body: "வலதுபுறம் உள்ள நடைமுறை அட்டையை சொடுக்கவும்",
    guide_step4_title: "ஒவ்வொரு நடைமுறையிலும் 3 தாவல்கள்",
    guide_step4_body: "ஆவணங்கள் → வழிகாட்டு → முறையிடு",
    guide_step5_title: "முன்-நிரப்பிய படிவத்தை பதிவிறக்கவும்",
    guide_step5_body: "உங்கள் விவரங்களுடன் ஏற்கனவே நிரப்பப்பட்டுள்ளது",
    guide_step6_title: "முழுமையான ஆவண தொகுப்பை பெறுங்கள்",
    guide_step6_body: "அனைத்து படிவங்களும் ஒரே PDF இல்",
    guide_dismiss: "புரிந்தது",
    guide_next: "அடுத்த குறிப்பு",
  },
  hi: {
    appName: "PaperTrail AI",
    tagline: "आपका सरकारी कार्य सहायक",
    heroTitle: "आज मैं आपकी कैसे मदद कर सकता हूँ?",
    heroSubtitle:
      "अपनी स्थिति बताएं और मैं हर सरकारी प्रक्रिया की पहचान करूँगा, फॉर्म तैयार करूँगा, और कदम-दर-कदम मार्गदर्शन करूँगा।",
    inputPlaceholderFirst:
      "क्या हुआ बताइए... (जैसे, 'मेरे दादाजी चेन्नई में गुज़र गए')",
    inputPlaceholder: "अपना जवाब टाइप करें...",
    send: "भेजें",
    enterToSend: "भेजने के लिए Enter · नई पंक्ति Shift+Enter",
    startCase: "एक केस शुरू करें",
    caseDashboard: "केस डैशबोर्ड",
    overallProgress: "कुल प्रगति",
    estimatedDays: "अनुमानित दिन",
    totalFees: "कुल शुल्क",
    procedures: "प्रक्रियाएं",
    continueInChat: "चैट में जारी रखें",
    retry: "पुन: प्रयास",
    loading: "लोड हो रहा है...",
    errorServer:
      "क्षमा करें, सर्वर से कनेक्ट करने में त्रुटि। कृपया सुनिश्चित करें कि बैकएंड चल रहा है।",
    errorLoadCase:
      "केस डेटा लोड नहीं हो सका। सुनिश्चित करें कि बैकएंड चल रहा है।",
    noCaseData: "कोई केस डेटा नहीं मिला",
    withNyayaMitra: "PaperTrail AI के साथ",
    withoutHelp: "बिना मदद के",
    yourProcedurePlan: "आपकी प्रक्रिया योजना",
    generateForm: "फॉर्म बनाएं",
    navigate: "मार्गदर्शन",
    escalate: "शिकायत करें",
    downloadPdf: "PDF डाउनलोड",
    documentsChecklist: "दस्तावेज़ चेकलिस्ट",
    whatToSay: "क्या कहना है",
    proTips: "सुझाव (अगर वे मना करें)",
    rtiReady: "RTI आवेदन तैयार",
    howToSubmit: "कैसे जमा करें",
    // Step Guide
    guide_step1_title: "क्या हुआ बताइए",
    guide_step1_body: "किसी भी भाषा में अपनी स्थिति टाइप या बोलें",
    guide_step2_title: "आपकी स्थिति का विश्लेषण हो रहा है",
    guide_step2_body: "6 AI एजेंट आपकी ज़रूरतें पहचान रहे हैं",
    guide_step3_title: "आपकी कार्य योजना तैयार है",
    guide_step3_body: "दाईं ओर किसी भी प्रक्रिया कार्ड पर क्लिक करें",
    guide_step4_title: "हर प्रक्रिया में 3 टैब हैं",
    guide_step4_body: "दस्तावेज़ → मार्गदर्शन → शिकायत",
    guide_step5_title: "पहले से भरा फॉर्म डाउनलोड करें",
    guide_step5_body: "आपकी जानकारी से पहले ही भरा हुआ है",
    guide_step6_title: "पूरा दस्तावेज़ किट प्राप्त करें",
    guide_step6_body: "सभी फॉर्म एक PDF में",
    guide_dismiss: "समझ गया",
    guide_next: "अगला सुझाव",
  },
} as const;

export type StringKey = keyof (typeof strings)["en"];

/** Get a translated string for the given language and key. */
export function t(lang: SupportedLang, key: StringKey): string {
  return strings[lang]?.[key] ?? strings.en[key] ?? key;
}

/** Get the full strings object for a language. */
export function getStrings(lang: SupportedLang) {
  return strings[lang] ?? strings.en;
}
