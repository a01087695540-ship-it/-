import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Check, 
  Send, 
  History, 
  Settings2, 
  FileCheck2, 
  HelpCircle, 
  User, 
  AlertCircle, 
  Sliders, 
  Briefcase, 
  Clock, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SurveyData, SubmissionRecord } from "./types";

// ▼ 구글 스프레드시트 연동용 Google Apps Script Web App URL을 입력해주십시오.
// 배포한 Web App URL 주소를 아래에 붙여넣으면 제출 시 자동으로 시트에 입력됩니다.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwbzgYb6gnMYQbqMrnZpi_5L96YooAKp6kdnyvwzPQ2dI6oGIuTPpDebnYep1_aVzEOxQ/exec";

export default function App() {
  // Survey Form States
  const [formData, setFormData] = useState<SurveyData>({
    name: "",
    companyIp: "",
    aiTools: [],
    aiFreq: "",
    aiUsage: [],
    aiLevel: 0,
    jobTasks: [],
    jobTaskOtherText: "",
    autoWants: [],
    autoWantOtherText: "",
    timeSpent: "",
    autoDetail: "",
    expectation: "",
    freeOpinion: "",
  });

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Error boundary indices to trigger validation markings
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Question blocks references to smooth scroll to the first invalid block
  const blockRefs = {
    name: useRef<HTMLDivElement>(null),
    companyIp: useRef<HTMLDivElement>(null),
    aiTools: useRef<HTMLDivElement>(null),
    aiFreq: useRef<HTMLDivElement>(null),
    aiUsage: useRef<HTMLDivElement>(null),
    aiLevel: useRef<HTMLDivElement>(null),
    jobTasks: useRef<HTMLDivElement>(null),
    autoWants: useRef<HTMLDivElement>(null),
    timeSpent: useRef<HTMLDivElement>(null),
    autoDetail: useRef<HTMLDivElement>(null),
    expectation: useRef<HTMLDivElement>(null),
  };

  // Handler for text inputs / textarea
  const handleTextChange = (key: keyof SurveyData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Clear validation error if any
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Handler for Q2 (AI Tools) selection
  const handleAiToolsSelect = (item: string) => {
    setFormData((prev) => {
      let nextTools = [...prev.aiTools];
      if (item === "사용 안 함") {
        nextTools = ["사용 안 함"]; // Clear all others
      } else {
        // If "사용 안 함" was selected previously, remove it
        nextTools = nextTools.filter((t) => t !== "사용 안 함");
        if (nextTools.includes(item)) {
          nextTools = nextTools.filter((t) => t !== item);
        } else {
          nextTools.push(item);
        }
      }
      return { ...prev, aiTools: nextTools };
    });

    if (errors.aiTools) {
      setErrors((prev) => ({ ...prev, aiTools: false }));
    }
  };

  // Handler for Q4 (AI Usage) selection
  const handleAiUsageSelect = (item: string) => {
    setFormData((prev) => {
      let nextUsage = [...prev.aiUsage];
      if (item === "활용 안 함") {
        nextUsage = ["활용 안 함"]; // Clear all others
      } else {
        nextUsage = nextUsage.filter((u) => u !== "활용 안 함");
        if (nextUsage.includes(item)) {
          nextUsage = nextUsage.filter((u) => u !== item);
        } else {
          nextUsage.push(item);
        }
      }
      return { ...prev, aiUsage: nextUsage };
    });

    if (errors.aiUsage) {
      setErrors((prev) => ({ ...prev, aiUsage: false }));
    }
  };

  // Handler for Q6 (Job Tasks) selection
  const handleJobTasksSelect = (item: string) => {
    setFormData((prev) => {
      let nextTasks = [...prev.jobTasks];
      if (nextTasks.includes(item)) {
        nextTasks = nextTasks.filter((t) => t !== item);
      } else {
        nextTasks.push(item);
      }
      return { ...prev, jobTasks: nextTasks };
    });

    if (errors.jobTasks) {
      setErrors((prev) => ({ ...prev, jobTasks: false }));
    }
  };

  // Handler for Q7 (Automation Wants) selection
  const handleAutoWantsSelect = (item: string) => {
    setFormData((prev) => {
      let nextWants = [...prev.autoWants];
      if (nextWants.includes(item)) {
        nextWants = nextWants.filter((w) => w !== item);
      } else {
        nextWants.push(item);
      }
      return { ...prev, autoWants: nextWants };
    });

    if (errors.autoWants) {
      setErrors((prev) => ({ ...prev, autoWants: false }));
    }
  };

  // Perform Form Validity Checks
  const validateForm = (): boolean => {
    const newErrors: Record<string, boolean> = {};

    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.companyIp.trim()) newErrors.companyIp = true;
    if (formData.aiTools.length === 0) newErrors.aiTools = true;
    if (!formData.aiFreq) newErrors.aiFreq = true;
    if (formData.aiUsage.length === 0) newErrors.aiUsage = true;
    if (formData.aiLevel === 0) newErrors.aiLevel = true;
    if (formData.jobTasks.length === 0) newErrors.jobTasks = true;
    if (formData.autoWants.length === 0) newErrors.autoWants = true;
    if (!formData.timeSpent) newErrors.timeSpent = true;
    if (!formData.autoDetail.trim()) newErrors.autoDetail = true;
    if (!formData.expectation) newErrors.expectation = true;

    setErrors(newErrors);

    // Find first error block key and scroll there
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      const firstErrorKey = errorKeys[0] as keyof typeof blockRefs;
      blockRefs[firstErrorKey]?.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return false;
    }

    return true;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload = {
      이름: formData.name,
      EPID: formData.companyIp,
      AI툴: formData.aiTools.join(", "),
      AI사용빈도: formData.aiFreq,
      AI활용분야: formData.aiUsage.join(", "),
      AI활용수준: formData.aiLevel,
      담당업무: formData.jobTasks.join(", ") + 
        (formData.jobTasks.includes("기타") && formData.jobTaskOtherText.trim() 
          ? ` (기타 상세: ${formData.jobTaskOtherText.trim()})` 
          : ""),
      자동화희망작업: formData.autoWants.join(", ") + 
        (formData.autoWants.includes("기타") && formData.autoWantOtherText.trim() 
          ? ` (기타 상세: ${formData.autoWantOtherText.trim()})` 
          : ""),
      소요시간: formData.timeSpent,
      자동화상세: formData.autoDetail,
      교육기대사항: formData.expectation,
      자유의견: formData.freeOpinion,
      제출시각: new Date().toLocaleString("ko-KR"),
    };

    let submittedSuccessfully = false;

    // SCRIPT_URL이 기본 예시에서 올바르게 설정되어 있을 주소인지 검사합니다.
    const hasValidScriptUrl = SCRIPT_URL && 
      SCRIPT_URL.trim() !== "" && 
      SCRIPT_URL.startsWith("https://script.google.com");

    if (hasValidScriptUrl) {
      try {
        // App Script POST using CORS exception / mode no-cors
        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain",
          },
          body: JSON.stringify(payload),
        });
        submittedSuccessfully = true;
      } catch (err) {
        console.error("Fetch output warning:", err);
      }
    } else {
      // SCRIPT_URL이 입력되어 있지 않은 상태이더라도 시뮬레이션 성공 처리로 로컬 제출 완료 처리됩니다.
      submittedSuccessfully = true;
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      aiTools: [],
      aiFreq: "",
      aiUsage: [],
      aiLevel: 0,
      jobTasks: [],
      jobTaskOtherText: "",
      autoWants: [],
      autoWantOtherText: "",
      timeSpent: "",
      autoDetail: "",
      expectation: "",
      freeOpinion: "",
    });
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans p-4 sm:p-8 bg-slate-50/50">
      
      {/* ── 메인 화면 ── */}
      <main className="max-w-2xl mx-auto mt-4 sm:mt-8">
        
        {/* 제출 완료 시 화면 */}
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-100 p-10 rounded-3xl shadow-xl text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 bg-rose-50 border border-rose-150 rounded-full flex items-center justify-center text-[#C8102E]">
                <FileCheck2 className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">설문조사가 완료되었습니다!</h2>
                <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                  소중한 답변 감사드립니다. 보내주신 소중한 의견은 실제 AX 교육 과정의 실습 프로젝트에 적극적으로 연동 및 반영됩니다.
                </p>
              </div>

              {/* 저장된 응답 요약 */}
              <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs space-y-2.5 max-w-md mx-auto border border-slate-100">
                <div className="border-b border-slate-200 pb-1.5 flex justify-between">
                  <span className="font-bold text-slate-700">작성자 정보</span>
                  <span className="text-slate-400 font-mono">제출 완료</span>
                </div>
                <div className="grid grid-cols-3 gap-y-1.5 text-slate-600">
                  <span className="font-medium text-slate-400">이름</span>
                  <span className="col-span-2 text-slate-800 font-semibold">{formData.name}</span>

                  <span className="font-medium text-slate-400">EP ID</span>
                  <span className="col-span-2 text-slate-800 font-semibold">{formData.companyIp}</span>
                  
                  <span className="font-medium text-slate-400">사용 중인 AI</span>
                  <span className="col-span-2 text-slate-800 truncate">{formData.aiTools.join(", ")}</span>

                  <span className="font-medium text-slate-400">자동화 희망</span>
                  <span className="col-span-2 text-slate-800 truncate">{formData.autoWants.join(", ")}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors cursor-pointer"
                >
                  새로 작성하기
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── 설문조사 작성 폼 ── */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 타이틀 헤더 */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="border-l-4 border-[#C8102E] pl-4 space-y-2">
                  <div className="text-xs sm:text-sm font-extrabold tracking-widest text-[#C8102E] uppercase">
                    LOTTE GRS ACADEMY
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                    AX 부스터 과정 <span className="font-medium text-slate-500 text-lg sm:text-xl">사전 설문조사</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    여러분들의 현업 업무를 실제 실습 과제로 연동하기 위한 설문입니다.<br className="hidden sm:block" />
                    솔직하게 작성해 주실수록 더욱 실용적이고 맞춤화된 교육이 수립됩니다.
                  </p>
                </div>
              </div>

              {/* ────── SECTION 1. 기본 정보 ────── */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
                <div className="pb-3 border-b border-rose-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#C8102E] tracking-widest uppercase">
                    Section 1. 기본 정보
                  </span>
                </div>

                {/* Q1. 필수 */}
                <div 
                  ref={blockRefs.name}
                  className={`space-y-3 p-4 rounded-2xl transition-all ${
                    errors.name ? "bg-red-50/50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <label htmlFor="q1-input" className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">1.</span>
                    이름을 입력해주세요 <span className="text-[#C8102E] font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="q1-input"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleTextChange("name", e.target.value)}
                      placeholder="예) 홍길동"
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-white hover:border-[#C8102E] focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] transition-all"
                    />
                    {formData.name.trim() && <Check className="absolute right-3.5 top-3.5 w-4 h-4 text-emerald-500" />}
                  </div>
                  {errors.name && (
                    <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 이름을 필수 입력해 주세요.
                    </span>
                  )}
                </div>

                {/* Q2. EP ID 입력 */}
                <div 
                  ref={blockRefs.companyIp}
                  className={`space-y-3 p-4 rounded-2xl transition-all ${
                    errors.companyIp ? "bg-red-50/50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <label htmlFor="q2-ip-input" className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">2.</span>
                    EP ID를 입력해주세요 <span className="text-[#C8102E] font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="q2-ip-input"
                      type="text"
                      value={formData.companyIp}
                      onChange={(e) => handleTextChange("companyIp", e.target.value)}
                      placeholder="예시)seungkook.park"
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-white hover:border-[#C8102E] focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] transition-all"
                    />
                    {formData.companyIp.trim() && <Check className="absolute right-3.5 top-[#14px] w-4 h-4 text-emerald-500" />}
                  </div>
                  {errors.companyIp && (
                    <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> EP ID를 필수 입력해 주세요.
                    </span>
                  )}
                </div>
              </div>

              {/* ────── SECTION 2. 생성형 AI 활용 수준 ────── */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
                <div className="pb-3 border-b border-rose-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#C8102E] tracking-widest uppercase">
                    Section 2. 생성형 AI 활용 수준
                  </span>
                </div>

                {/* Q3. 체크박스 그룹 */}
                <div 
                  ref={blockRefs.aiTools}
                  className={`space-y-3 p-4 rounded-2xl transition-all ${
                    errors.aiTools ? "bg-red-50/50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <div className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">3.</span>
                    실제 업무에 사용하는 생성형 AI 툴을 선택해주세요 <span className="text-slate-400 font-normal text-xs">(중복 가능)</span> <span className="text-[#C8102E] font-bold">*</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      "AiMember",
                      "ChatGPT",
                      "Claude",
                      "Copilot",
                      "Gemini",
                      "GenSpark",
                      "사용 안 함"
                    ].map((tool) => {
                      const isSelected = formData.aiTools.includes(tool);
                      return (
                        <button
                          key={tool}
                          type="button"
                          onClick={() => handleAiToolsSelect(tool)}
                          className={`flex items-center gap-3 border rounded-xl p-3 text-left transition-all cursor-pointer text-xs sm:text-sm ${
                            isSelected 
                              ? "bg-rose-50 text-slate-900 font-semibold border-red-500 ring-1 ring-red-400" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-350"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isSelected 
                              ? "bg-[#C8102E] border-[#C8102E]" 
                              : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                          <span>{tool}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.aiTools && (
                    <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 사용하는 생성형 AI 툴을 최소 하나 이상 선택해 주세요.
                    </span>
                  )}
                </div>

                {/* Q4. 라디오 버튼 */}
                <div 
                  ref={blockRefs.aiFreq}
                  className={`space-y-3 p-4 rounded-2xl transition-all ${
                    errors.aiFreq ? "bg-red-50/50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <div className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">4.</span>
                    생성형 AI를 얼마나 자주 사용하나요? <span className="text-[#C8102E] font-bold">*</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {["거의 안 씀", "월 1~2회", "주 1~2회", "거의 매일"].map((freq) => {
                      const isSelected = formData.aiFreq === freq;
                      return (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, aiFreq: freq }));
                            if (errors.aiFreq) setErrors((prev) => ({ ...prev, aiFreq: false }));
                          }}
                          className={`flex items-center gap-3 border rounded-xl p-3 text-left transition-all cursor-pointer text-xs sm:text-sm ${
                            isSelected 
                              ? "bg-rose-50 text-slate-900 font-semibold border-red-500 ring-1 ring-red-400" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-350"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                            isSelected 
                              ? "bg-[#C8102E] border-[#C8102E]" 
                              : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{freq}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.aiFreq && (
                    <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> AI 사용 빈도를 선택해 주세요.
                    </span>
                  )}
                </div>

                {/* Q5. 체크박스 그룹 */}
                <div 
                  ref={blockRefs.aiUsage}
                  className={`space-y-3 p-4 rounded-2xl transition-all ${
                    errors.aiUsage ? "bg-red-50/50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <div className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">5.</span>
                    생성형 AI를 어떤 업무에 활용하고 있나요? <span className="text-slate-400 font-normal text-xs">(중복 가능)</span> <span className="text-[#C8102E] font-bold">*</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      "문서 작성",
                      "번역·요약",
                      "아이디어 발굴",
                      "코드 작성",
                      "데이터 분석",
                      "활용 안 함",
                    ].map((usage) => {
                      const isSelected = formData.aiUsage.includes(usage);
                      return (
                        <button
                          key={usage}
                          type="button"
                          onClick={() => handleAiUsageSelect(usage)}
                          className={`flex items-center gap-3 border rounded-xl p-3 text-left transition-all cursor-pointer text-xs sm:text-sm ${
                            isSelected 
                              ? "bg-rose-50 text-slate-900 font-semibold border-red-500 ring-1 ring-red-400" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-350"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isSelected 
                              ? "bg-[#C8102E] border-[#C8102E]" 
                              : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                          <span>{usage}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.aiUsage && (
                    <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> AI 활용 업무 분야를 하나 이상 선택해 주세요.
                    </span>
                  )}
                </div>

                {/* Q6. 척도 (1-5 Level) */}
                <div 
                  ref={blockRefs.aiLevel}
                  className={`space-y-3 p-4 rounded-2xl transition-all ${
                    errors.aiLevel ? "bg-red-50/50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <div className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">6.</span>
                    나의 생성형 AI 활용 수준은 어느 정도입니까? <span className="text-[#C8102E] font-bold">*</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((lvl) => {
                        const isSelected = formData.aiLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, aiLevel: lvl }));
                              if (errors.aiLevel) setErrors((prev) => ({ ...prev, aiLevel: false }));
                            }}
                            className={`flex-1 py-3 text-center border font-semibold rounded-xl transition-all cursor-pointer text-sm ${
                              isSelected 
                                ? "bg-[#C8102E] text-white border-[#C8102E] shadow-sm transform scale-102" 
                                : "bg-white text-slate-600 border-slate-200 hover:border-rose-250 hover:bg-rose-50/40"
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 px-1 font-medium">
                      <span>1 (접하지 않음)</span>
                      <span>5 (업무 적극 적용)</span>
                    </div>
                  </div>
                  {errors.aiLevel && (
                    <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 활용 수준을 선택해 주세요.
                    </span>
                  )}
                </div>

              </div>

              {/* ────── SECTION 3. 현업 자동화 니즈 ────── */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
                <div className="pb-3 border-b border-rose-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#C8102E] tracking-widest uppercase">
                    Section 3. 현업 자동화 니즈
                  </span>
                </div>

                {/* Q7. 주요 담당 업무 */}
                <div 
                  ref={blockRefs.jobTasks}
                  className={`space-y-3 p-4 rounded-2xl transition-all ${
                    errors.jobTasks ? "bg-red-50/50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <div className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">7.</span>
                    주요 담당 업무를 선택해주세요 <span className="text-slate-400 font-normal text-xs">(중복 가능)</span> <span className="text-[#C8102E] font-bold">*</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans">
                    {[
                      "메뉴·상품 기획",
                      "프로모션·캠페인 운영",
                      "매장 운영 관리",
                      "가맹점 관리·지원",
                      "구매·발주·재고 관리",
                      "매출·실적 데이터 분석",
                      "채용·교육·평가 관리",
                      "계약·법무·행정",
                      "IT·시스템 운영",
                      "해외법인 커뮤니케이션",
                      "기타",
                    ].map((task) => {
                      const isSelected = formData.jobTasks.includes(task);
                      return (
                        <button
                          key={task}
                          type="button"
                          onClick={() => handleJobTasksSelect(task)}
                          className={`flex items-center gap-3 border rounded-xl p-3 text-left transition-all cursor-pointer text-xs sm:text-sm ${
                            isSelected 
                              ? "bg-rose-50 text-slate-900 font-semibold border-red-500 ring-1 ring-red-400" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-350"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isSelected 
                              ? "bg-[#C8102E] border-[#C8102E]" 
                              : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                          <span>{task}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 💡 "6번에 기타 누르면 글 쓸 수 있게 해줘" (Dynamic custom input for other fields) */}
                  <AnimatePresence>
                    {formData.jobTasks.includes("기타") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-2.5 pl-1"
                      >
                        <div className="bg-rose-50/40 border border-red-150 p-4 rounded-2xl space-y-2 mt-1">
                          <label htmlFor="q6-other-input" className="block text-xs font-bold text-red-800 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#C8102E]" />
                            기타 항목 구체적 입력
                          </label>
                          <input
                            id="q6-other-input"
                            type="text"
                            value={formData.jobTaskOtherText}
                            onChange={(e) => handleTextChange("jobTaskOtherText", e.target.value)}
                            placeholder="예: 가맹 영업 지원, 브랜드 기획 등 직접 입력"
                            className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {errors.jobTasks && (
                    <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 주요 담당 업무를 최소 하나 이상 선택해 주세요.
                    </span>
                  )}
                </div>

                {/* Q8. 자동화 희망 및 "기타 "글 쓰기 기능 추가 */}
                <div 
                  ref={blockRefs.autoWants}
                  className={`space-y-3 p-4 rounded-2xl transition-all ${
                    errors.autoWants ? "bg-red-50/50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <div className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">8.</span>
                    반복적으로 하는 업무 중 자동화하고 싶은 것은 무엇입니까? <span className="text-slate-400 font-normal text-xs">(중복 가능)</span> <span className="text-[#C8102E] font-bold">*</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      "보고서·문서 작성",
                      "데이터 수집·정리·가공",
                      "이메일·메신저 응대",
                      "회의록 작성",
                      "실적·현황 집계",
                      "자료 검색·요약",
                      "승인·결재 처리",
                      "매장 현황 모니터링",
                      "기타",
                    ].map((want) => {
                      const isSelected = formData.autoWants.includes(want);
                      return (
                        <button
                          key={want}
                          type="button"
                          onClick={() => handleAutoWantsSelect(want)}
                          className={`flex items-center gap-3 border rounded-xl p-3 text-left transition-all cursor-pointer text-xs sm:text-sm ${
                            isSelected 
                              ? "bg-rose-50 text-slate-900 font-semibold border-red-500 ring-1 ring-red-400" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-350"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isSelected 
                              ? "bg-[#C8102E] border-[#C8102E]" 
                              : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                          <span>{want}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 💡 "7번에 기타 누르면 글 쓸 수 있게 해줘" (Dynamic custom input for other fields) */}
                  <AnimatePresence>
                    {formData.autoWants.includes("기타") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-2.5 pl-1"
                      >
                        <div className="bg-rose-50/40 border border-red-150 p-4 rounded-2xl space-y-2 mt-1">
                          <label htmlFor="q7-other-input" className="block text-xs font-bold text-red-800 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#C8102E]" />
                            기타 항목 구체적 입력
                          </label>
                          <input
                            id="q7-other-input"
                            type="text"
                            value={formData.autoWantOtherText}
                            onChange={(e) => handleTextChange("autoWantOtherText", e.target.value)}
                            placeholder="예: 각 매장 카카오톡 소통 채널 민원 요약 자동 생성 등"
                            className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {errors.autoWants && (
                    <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 자동화 희망 정형 업무를 최소 하나 선택해 주세요.
                    </span>
                  )}
                </div>

                {/* Q9. 소요시간 */}
                <div 
                  ref={blockRefs.timeSpent}
                  className={`space-y-3 p-4 rounded-2xl transition-all ${
                    errors.timeSpent ? "bg-red-50/50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <div className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">9.</span>
                    해당 반복 업무에 하루 평균 얼마만큼의 시간을 사용하고 계신가요? <span className="text-[#C8102E] font-bold">*</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {["30분 미만", "30분~1시간", "1~2시간", "2시간 이상"].map((time) => {
                      const isSelected = formData.timeSpent === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, timeSpent: time }));
                            if (errors.timeSpent) setErrors((prev) => ({ ...prev, timeSpent: false }));
                          }}
                          className={`flex items-center gap-3 border rounded-xl p-3 text-left transition-all cursor-pointer text-xs sm:text-sm ${
                            isSelected 
                              ? "bg-rose-50 text-slate-900 font-semibold border-red-500 ring-1 ring-red-400" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-350"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                            isSelected 
                              ? "bg-[#C8102E] border-[#C8102E]" 
                              : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{time}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.timeSpent && (
                    <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 소요 시간을 선택해 주세요.
                    </span>
                  )}
                </div>

                {/* Q10. 자동화 설명 (Textarea) */}
                <div 
                  ref={blockRefs.autoDetail}
                  className={`space-y-3 p-4 rounded-2xl transition-all ${
                    errors.autoDetail ? "bg-red-50/50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <label htmlFor="q10-input" className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">10.</span>
                    자동화하고 싶은 업무를 구체적으로 자유롭게 설명해주세요 <span className="text-[#C8102E] font-bold">*</span>
                  </label>
                  <textarea
                    id="q10-input"
                    value={formData.autoDetail}
                    onChange={(e) => handleTextChange("autoDetail", e.target.value)}
                    placeholder="예) 매주 월요일 각 가맹 매장 매출 현황을 엑셀로 기합해서 보고서로 만들어야 하는데, 복사 및 붙여넣기 수작업이 많아 1시간 이상 소요됩니다."
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl p-4 bg-white focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] transition-all min-h-[100px] resize-y leading-relaxed"
                  />
                  {errors.autoDetail && (
                    <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 업무 구체적 설명을 필수로 입력해 주세요.
                    </span>
                  )}
                </div>

              </div>

              {/* ────── SECTION 4. 교육 기대사항 ────── */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
                <div className="pb-3 border-b border-rose-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#C8102E] tracking-widest uppercase">
                    Section 4. 교육 기대사항
                  </span>
                </div>

                {/* Q11. 교육 기대 사항 (라디오) */}
                <div 
                  ref={blockRefs.expectation}
                  className={`space-y-3 p-4 rounded-2xl transition-all ${
                    errors.expectation ? "bg-red-50/50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <div className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">11.</span>
                    이번 AX 교육에서 가장 기대하는 사항은 무엇입니까? <span className="text-[#C8102E] font-bold">*</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      "실무에 바로 쓸 수 있는 툴 실습",
                      "AI 활용 아이디어 발굴",
                      "개인 및 부서 업무 자동화 방법",
                      "기초 개념 이해",
                    ].map((exp) => {
                      const isSelected = formData.expectation === exp;
                      return (
                        <button
                          key={exp}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, expectation: exp }));
                            if (errors.expectation) setErrors((prev) => ({ ...prev, expectation: false }));
                          }}
                          className={`flex items-center gap-3 border rounded-xl p-3 text-left transition-all cursor-pointer text-xs sm:text-sm ${
                            isSelected 
                              ? "bg-rose-50 text-slate-900 font-semibold border-red-500 ring-1 ring-red-400" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-350"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                            isSelected 
                              ? "bg-[#C8102E] border-[#C8102E]" 
                              : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{exp}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.expectation && (
                    <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 교육 기대 사항을 선택해 주세요.
                    </span>
                  )}
                </div>

                {/* Q12. 자유 의견 */}
                <div className="space-y-3 p-4">
                  <label htmlFor="q12-input" className="block text-sm font-semibold text-slate-850 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-[#C8102E] font-bold">12.</span>
                    자유 의견 <span className="text-slate-400 font-normal leading-relaxed">(선택)</span>
                  </label>
                  <textarea
                    id="q12-input"
                    value={formData.freeOpinion}
                    onChange={(e) => handleTextChange("freeOpinion", e.target.value)}
                    placeholder="교육에 바라는 점이나 하고 싶은 말씀이 있다면 자유롭게 입력해주세요."
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl p-4 bg-white focus:outline-[#C8102E] focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] transition-all min-h-[90px] resize-y leading-relaxed"
                  />
                </div>

              </div>

              {/* 제출하기 버튼 */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#C8102E] text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-[#a90c24] active:transform active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-sm sm:text-base cursor-pointer shadow-md"
                >
                  <Send className="w-4.5 h-4.5" />
                  {isSubmitting ? "설문 제출 중..." : "설문 제출하기"}
                </button>
              </div>

            </form>
          )}
        </AnimatePresence>

      </main>

      {/* 푸터 안내 */}
      <footer className="max-w-2xl mx-auto mt-12 text-center text-slate-400 text-[10px] leading-relaxed pb-12">
        <p className="font-semibold text-slate-500">© 2026 Lotte GRS Academy. All rights reserved.</p>
        <p className="mt-1">본 설문 시스템은 롯데GRS 아카데미 교육 과정의 원활한 수행을 돕습니다.</p>
      </footer>
    </div>
  );
}
