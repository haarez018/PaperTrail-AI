/** Lightweight i18n strings for NyayaMitra UI. */

export type SupportedLang = "en" | "ta" | "hi";

const strings = {
  en: {
    appName: "NyayaMitra",
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
    withNyayaMitra: "With NyayaMitra",
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
  },
  ta: {
    appName: "நியாயமித்ரா",
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
    withNyayaMitra: "நியாயமித்ராவுடன்",
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
  },
  hi: {
    appName: "न्यायमित्र",
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
    withNyayaMitra: "न्यायमित्र के साथ",
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
