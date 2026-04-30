import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const InterviewRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const mode = location.state?.mode || 'text';

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [interviewId, setInterviewId] = useState(null);
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingSpeech, setPendingSpeech] = useState(null); // { type, text, voice? }
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [questionAudioPlayed, setQuestionAudioPlayed] = useState(false);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  const isLastQuestion = currentIndex === questions.length - 1;

  // Load questions
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await api.get(`/interview/${id}`);
        const interview = res.data;
        setInterviewId(id);
        setInterviewData(interview);
        setQuestions(interview.questions.map(q => q.questionText));
      } catch (err) {
        console.error('Failed to fetch interview:', err);
        showToast('Failed to load interview. Returning to dashboard.', 'error');
        navigate('/dashboard');
      }
    };
    if (id) fetchInterview();
  }, [id, navigate, showToast]);

  // Timer – runs only when not speaking and not paused
  useEffect(() => {
    if (mode !== 'voice' || isSpeaking || isTimerPaused) return;
    if (timeLeft === 0 && !isLastQuestion) handleSkip();
    const timer = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, currentIndex, isLastQuestion, mode, isSpeaking, isTimerPaused]);

  // Play TTS and return promise when finished
  const playTTS = (text, voice = 'af_heart', speed = 1.0) => {
    return new Promise(async (resolve, reject) => {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setIsSpeaking(true);
      try {
        const response = await api.post('/tts', { text, voice, speed }, { responseType: 'blob' });
        const audioUrl = URL.createObjectURL(response.data);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          audioRef.current = null;
          resolve();
        };
        audio.onerror = (err) => {
          console.error('Audio playback error', err);
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          audioRef.current = null;
          reject(err);
        };
        audio.play();
      } catch (err) {
        console.error('TTS API error, falling back to browser speech', err);
        // Fallback to browser speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.voice = window.speechSynthesis.getVoices().find(v => v.lang === 'en-US');
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          reject();
        };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        audioRef.current = null;
      }
    });
  };

  // Speak current question when it becomes active (only in voice mode and only once per question)
  useEffect(() => {
    if (mode === 'voice' && questions.length > 0 && questions[currentIndex] && !isSpeaking && !questionAudioPlayed) {
      (async () => {
        await playTTS(questions[currentIndex]);
        setQuestionAudioPlayed(true);
        // Timer starts only after question TTS finishes
        setTimeLeft(60);
        setIsTimerPaused(false);
      })();
    }
  }, [currentIndex, questions, mode, questionAudioPlayed]);

  // Reset question audio played flag when question changes
  useEffect(() => {
    setQuestionAudioPlayed(false);
    // Stop any currently playing audio when question changes
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, [currentIndex]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      // Stop speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsSpeaking(false);
      setIsRecording(false);
    };
  }, []);

  // Replay question button
  const handleReplay = async () => {
    if (mode === 'voice' && questions[currentIndex]) {
      // Stop any ongoing speech
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setIsSpeaking(false);
      await playTTS(questions[currentIndex]);
      // Don't reset timer, keep original time
    }
  };

  // Speech recognition (unchanged)
  const setupRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Your browser doesn't support speech recognition. Please use text mode.", 'error');
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      if (finalTranscript) setCurrentAnswer(prev => prev + ' ' + finalTranscript);
      setInterimText(interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
    };
    return recognition;
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = setupRecognition();
    }
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // Submit answer and get feedback
  const submitAnswerToBackend = async (questionIndex, answer, duration) => {
    if (!interviewId) return { score: 70, feedback: 'Could not evaluate' };
    try {
      const res = await api.post(`/interview/${interviewId}/answer`, {
        questionIndex,
        userAnswer: answer,
        duration
      });
      return res.data;
    } catch (err) {
      console.error('Failed to submit answer', err);
      return { score: 70, feedback: 'Could not evaluate' };
    }
  };

  // Handle answer submission – speak feedback first, then proceed
  const handleSubmit = async () => {
    if (!currentAnswer.trim()) return;
    const durationTaken = 60 - timeLeft;
    showToast('Submitting answer...', 'info');
    const evaluation = await submitAnswerToBackend(currentIndex, currentAnswer.trim(), durationTaken);
    const newAnswers = [...answers, {
      question: questions[currentIndex],
      answer: currentAnswer,
      score: evaluation.score,
      feedback: evaluation.feedback
    }];
    setAnswers(newAnswers);
    setCurrentAnswer('');

    // Stop question audio and pause timer
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsTimerPaused(true);

    // Move to next question immediately
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question submitted - complete the interview
      try {
        await api.post(`/interview/${interviewId}/complete`);
        console.log('Interview done', newAnswers);
        showToast('Interview completed! Redirecting to results...', 'success');
        navigate(`/results/${interviewId}`);
      } catch (err) {
        console.error('Failed to complete interview:', err);
        showToast('Could not complete interview. Please try again.', 'error');
      }
      return;
    }

    // Play feedback after moving to next question
    if (mode === 'voice') {
      await playTTS(evaluation.feedback);
      // After feedback ends, the next question will automatically play its audio and start timer
    }
  };

  const handleSkip = async () => {
    setCurrentAnswer('');
    // Stop any ongoing speech and pause timer
    if (mode === 'voice') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setIsSpeaking(false);
      setIsTimerPaused(true);
    }
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      if (mode !== 'voice') {
        setTimeLeft(60);
      }
    } else {
      // Interview finished by skipping - complete it
      try {
        await api.post(`/interview/${interviewId}/complete`);
        showToast('Interview completed! Redirecting to results...', 'success');
      } catch (err) {
        console.error('Failed to complete interview on skip:', err);
        showToast('Could not complete interview. Please try again.', 'error');
        return;
      }
      navigate(`/results/${interviewId}`);
    }
  };

  // Finish interview – similar to handleSkip but also mark complete
  const handleFinishInterview = async () => {
    if (!interviewId) {
      console.error('No interviewId available');
      showToast('Interview ID not found. Please try again.', 'error');
      return;
    }

    try {
      // If there is unsaved answer, submit it first (without waiting for feedback)
      if (currentAnswer.trim()) {
        console.log('Submitting current answer before finishing, currentIndex:', currentIndex, 'questions length:', questions.length);
        if (currentIndex < 0 || currentIndex >= questions.length) {
          console.error('Invalid currentIndex for submission:', currentIndex);
          showToast('Invalid question index. Cannot submit answer.', 'error');
          return;
        }
        const durationTaken = 60 - timeLeft;
        const evaluation = await submitAnswerToBackend(currentIndex, currentAnswer.trim(), durationTaken);
        const newAnswers = [...answers, {
          question: questions[currentIndex],
          answer: currentAnswer,
          score: evaluation.score,
          feedback: evaluation.feedback
        }];
        setAnswers(newAnswers);
        setCurrentAnswer('');
      }

      // Stop any ongoing speech and pause timer
      if (mode === 'voice' && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
        setIsSpeaking(false);
        setIsTimerPaused(true);
      }

      try {
        await api.post(`/interview/${interviewId}/complete`);
      } catch (completeError) {
        if (completeError.response?.status === 400 && completeError.response?.data?.error === 'Interview already completed') {
          // Interview already completed, just navigate to results
          showToast('Interview completed! Redirecting to results...', 'success');
          navigate(`/results/${interviewId}`);
          return;
        }
        throw completeError;
      }

      showToast('Interview completed! Redirecting to results...', 'success');
      navigate(`/results/${interviewId}`);
    } catch (err) {
      console.error('Failed to complete interview:', err);
      showToast('Could not complete interview. Please try again.', 'error');
    }
  };

  if (questions.length === 0) {
    return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Loading questions...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent">
            MockMate Interview - {interviewData?.category ? interviewData.category.charAt(0).toUpperCase() + interviewData.category.slice(1) : 'Loading'} ({mode === 'voice' ? 'Voice Mode 🎤' : 'Text Mode 📝'})
          </h1>
          <div className="flex gap-4">
            <span className="text-[#9ca3af]">Q{currentIndex+1}/{questions.length}</span>
            {!isSpeaking && !isTimerPaused && <span className="text-[#9ca3af]">⏱ {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</span>}
            {!isSpeaking && isTimerPaused && <span className="text-[#9ca3af]">⏸️ {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</span>}
            {isSpeaking && <span className="text-[#9ca3af]">🔊 Speaking...</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: AI Interviewer */}
          <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-6">
            <div className="flex flex-col items-center text-center">
              <div className="text-6xl mb-4">{mode === 'voice' ? '🗣️' : '🤖'}</div>
              <h3 className="text-xl font-semibold mb-2">AI Interviewer</h3>
              <p className="text-[#9ca3af] text-sm mb-4">Question {currentIndex+1}</p>
              <div className="bg-[#1c1c27] p-4 rounded-lg w-full">
                <p className="text-white">{questions[currentIndex]}</p>
              </div>
              {mode === 'voice' && (
                <button
                  onClick={handleReplay}
                  disabled={isSpeaking}
                  className="mt-4 text-purple-400 text-sm underline disabled:opacity-50"
                >
                  🔁 Replay Question
                </button>
              )}
            </div>
          </div>

          {/* Right: Answer Area – same as before */}
          <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {answers.map((ans, idx) => (
                <div key={idx}>
                  <div className="bg-[#1c1c27] p-3 rounded-lg mb-2">
                    <p className="text-purple-400 text-xs">Q{idx+1}: {ans.question}</p>
                    <p className="text-white mt-1">👤 {ans.answer}</p>
                  </div>
                  <div className="bg-purple-500/10 p-3 rounded-lg">
                    <p className="text-purple-400 text-xs">🤖 AI Feedback</p>
                    <p className="text-[#9ca3af] text-sm">{ans.feedback || (ans.score ? `Score: ${ans.score}/100` : 'Good answer!')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#2d2d3d] p-4">
              {mode === 'text' ? (
                <>
                  <div className="flex gap-2 mb-2">
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="flex-1 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg p-2 text-white resize-none"
                      rows="2"
                      placeholder="Type your answer..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmit}
                      disabled={isLastQuestion}
                      className={`bg-purple-600 px-4 py-2 rounded-lg ${isLastQuestion ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Send
                    </button>
                    <button
                      onClick={handleSkip}
                      disabled={isLastQuestion}
                      className={`border border-[#2d2d3d] px-4 py-2 rounded-lg ${isLastQuestion ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleFinishInterview}
                      className="border border-purple-500 text-purple-400 px-4 py-2 rounded-lg hover:bg-purple-500/10"
                    >
                      Finish Interview
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={startRecording}
                      disabled={isRecording}
                      className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      🎤 Start Recording
                    </button>
                    <button
                      onClick={stopRecording}
                      disabled={!isRecording}
                      className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      ⏹️ Stop Recording
                    </button>
                  </div>
                  {(currentAnswer || interimText) && (
                    <div className="bg-[#1c1c27] p-3 rounded-lg">
                      <p className="text-purple-400 text-xs mb-1">Your answer (live)</p>
                      <p className="text-white">{currentAnswer}<span className="text-gray-400">{interimText}</span></p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="flex-1 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg p-2 text-white resize-none"
                      rows="2"
                      placeholder="Edit your transcribed answer here..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmit}
                      disabled={isLastQuestion || isSpeaking}
                      className={`flex-1 bg-purple-600 py-2 rounded-lg ${(isLastQuestion || isSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Submit Answer
                    </button>
                    <button
                      onClick={handleSkip}
                      disabled={isLastQuestion || isSpeaking}
                      className={`flex-1 border border-[#2d2d3d] py-2 rounded-lg ${(isLastQuestion || isSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleFinishInterview}
                      className="flex-1 border border-purple-500 text-purple-400 py-2 rounded-lg hover:bg-purple-500/10"
                    >
                      Finish Interview
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;