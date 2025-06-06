'use client';

import { useState, useEffect } from 'react';
import { Genre, QuizQuestion, QuizAnswer, MoviePreferences } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

interface QuizComponentProps {
  onComplete: (preferences: MoviePreferences, answers: Record<string, any>) => void;
}

export default function QuizComponent({ onComplete }: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeQuiz();
  }, []);

  const initializeQuiz = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use Promise.allSettled for better error handling
      const [genresResult, moviesResult] = await Promise.allSettled([
        fetch('/api/tmdb/genres').then(res => {
          if (!res.ok) throw new Error(`Genres API failed: ${res.status}`);
          return res.json();
        }),
        fetch('/api/tmdb/popular').then(res => {
          if (!res.ok) throw new Error(`Popular movies API failed: ${res.status}`);
          return res.json();
        })
      ]);

      // Handle genres
      let genresData = [];
      if (genresResult.status === 'fulfilled') {
        // The API returns the genres array directly
        genresData = Array.isArray(genresResult.value) ? genresResult.value : [];
      } else {
        console.warn('Genres API failed, using fallback genres');
        // Fallback genres if API fails
        genresData = [
          { id: 28, name: 'Action' },
          { id: 35, name: 'Comedy' },
          { id: 18, name: 'Drama' },
          { id: 27, name: 'Horror' },
          { id: 10749, name: 'Romance' },
          { id: 878, name: 'Science Fiction' },
          { id: 53, name: 'Thriller' },
          { id: 16, name: 'Animation' },
          { id: 80, name: 'Crime' },
          { id: 99, name: 'Documentary' }
        ];
      }

      // Handle movies (for future use)
      if (moviesResult.status === 'rejected') {
        console.warn('Popular movies API failed:', moviesResult.reason);
      }

      if (genresData.length === 0) {
        throw new Error('No genres available');
      }

      setGenres(genresData);

      // Create quiz questions
      const quizQuestions: QuizQuestion[] = [
        {
          id: 'genres',
          question: 'Which genres do you prefer? (Select 3-5 genres)',
          type: 'multiple-choice',
          options: genresData.map((g: Genre) => g.name),
          required: true
        },
        {
          id: 'mood',
          question: 'What mood are you usually in when watching movies?',
          type: 'multiple-choice',
          options: [
            'Looking for excitement and thrills',
            'Want to laugh and feel good',
            'Seeking deep emotional stories',
            'I like puzzles that make me think',
            'Craving action and adventure',
            'Interested in true stories',
            'Want to be surprised or scared'
          ],
          required: true
        },
        {
          id: 'era',
          question: 'Which movie eras attract you the most? (Select 1-3 eras)',
          type: 'multiple-choice',
          options: [
            'Classic Hollywood cinema (1930s-60s)',
            'New Hollywood (1970s-80s)',
            '1990s cinema',
            '2000s films',
            '2010s cinema',
            'Recent releases (2020s)',
            'I appreciate films from all eras'
          ],
          required: true
        },
        {
          id: 'rating',
          question: 'What rating range do you prefer for movies?',
          type: 'multiple-choice',
          options: [
            'I love critically acclaimed films (8.0+ rating)',
            'I prefer well-reviewed movies (7.0+ rating)',
            'Rating doesn\'t matter to me',
            'I enjoy hidden gems (6.0+ rating)',
            'I like popular blockbusters regardless of rating'
          ],
          required: true
        }
      ];

      setQuestions(quizQuestions);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing quiz:', error);
      setError('Error loading quiz. Please refresh the page.');
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string | string[] | number) => {
    const existingAnswerIndex = answers.findIndex(a => a.questionId === questionId);
    const newAnswer: QuizAnswer = { questionId, answer };

    if (existingAnswerIndex >= 0) {
      const newAnswers = [...answers];
      newAnswers[existingAnswerIndex] = newAnswer;
      setAnswers(newAnswers);
    } else {
      setAnswers([...answers, newAnswer]);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Scroll to top when question changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestionIndex]);

  const completeQuiz = () => {
    // Process answers into MoviePreferences
    const preferences = processAnswers();
    
    // Convert answers array to object for easier handling
    const answersObject = answers.reduce((acc, answer) => {
      acc[answer.questionId] = answer.answer;
      return acc;
    }, {} as Record<string, any>);
    
    onComplete(preferences, answersObject);
  };

  const processAnswers = (): MoviePreferences => {
    const genreAnswer = answers.find(a => a.questionId === 'genres');
    const moodAnswer = answers.find(a => a.questionId === 'mood');
    const eraAnswer = answers.find(a => a.questionId === 'era');
    const ratingAnswer = answers.find(a => a.questionId === 'rating');

    // Map selected genre names to IDs
    const selectedGenreNames = genreAnswer?.answer as string[] || [];
    const favoriteGenres = genres
      .filter(g => selectedGenreNames.includes(g.name))
      .map(g => g.id);

    // Map era preferences to decades
    const selectedEras = eraAnswer?.answer as string[] || [];
    const preferredDecades = selectedEras.map(era => {
      if (era.includes('1930s-60s')) return ['1930', '1940', '1950', '1960'];
      if (era.includes('1970s-80s')) return ['1970', '1980'];
      if (era.includes('1990s')) return ['1990'];
      if (era.includes('2000s')) return ['2000'];
      if (era.includes('2010s')) return ['2010'];
      if (era.includes('2020s')) return ['2020'];
      if (era.includes('all eras')) return ['1970', '1980', '1990', '2000', '2010', '2020'];
      return [];
    }).flat();

    // Map mood preference to standardized values
    const moodText = moodAnswer?.answer as string || '';
    const moodPreferences = [];
    
    if (moodText.includes('excitement and thrills') || moodText.includes('action and adventure')) {
      moodPreferences.push('action', 'thriller');
    } else if (moodText.includes('laugh and feel good')) {
      moodPreferences.push('comedy');
    } else if (moodText.includes('deep emotional stories')) {
      moodPreferences.push('drama');
    } else if (moodText.includes('puzzles that make me think')) {
      moodPreferences.push('mystery', 'sci-fi');
    } else if (moodText.includes('true stories')) {
      moodPreferences.push('documentary', 'biography');
    } else if (moodText.includes('surprised or scared')) {
      moodPreferences.push('horror', 'thriller');
    }

    // Map rating preference to threshold
    const ratingText = ratingAnswer?.answer as string || '';
    let ratingThreshold = 7.0; // default
    
    if (ratingText.includes('8.0+ rating')) {
      ratingThreshold = 8.0;
    } else if (ratingText.includes('7.0+ rating')) {
      ratingThreshold = 7.0;
    } else if (ratingText.includes('6.0+ rating')) {
      ratingThreshold = 6.0;
    } else if (ratingText.includes('doesn\'t matter') || ratingText.includes('regardless of rating')) {
      ratingThreshold = 5.0;
    }

    return {
      favoriteGenres,
      preferredDecades: preferredDecades.length > 0 ? preferredDecades : ['2000', '2010', '2020'],
      favoriteActors: [], // Could be expanded later
      moodPreferences,
      ratingThreshold
    };
  };

  const getCurrentAnswer = () => {
    return answers.find(a => a.questionId === questions[currentQuestionIndex]?.id);
  };

  const isCurrentQuestionAnswered = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = getCurrentAnswer();
    
    if (!currentQuestion.required) return true;
    if (!currentAnswer) return false;
    
    if (Array.isArray(currentAnswer.answer)) {
      return currentAnswer.answer.length > 0;
    }
    
    return currentAnswer.answer !== undefined && currentAnswer.answer !== '';
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center min-h-96 space-y-4 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <div className="text-center space-y-2">
            <h3 className="font-semibold">Preparing your personalized quiz...</h3>
            <p className="text-sm text-muted-foreground">We're loading the latest movie data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center min-h-96 space-y-4 p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-destructive">Loading Error</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={initializeQuiz} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center min-h-96 space-y-4 p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-destructive">Configuration Error</h3>
            <p className="text-sm text-muted-foreground">No questions found. Please refresh the page.</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Bar */}
      <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-3">
          <span className="font-medium">Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span className="font-medium">{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl sm:text-2xl font-bold leading-tight max-w-4xl">
              {currentQuestion.question}
            </CardTitle>
            {currentQuestion.required && (
              <Badge variant="secondary" className="shrink-0 ml-4">
                Required
              </Badge>
            )}
          </div>
          {currentQuestion.id === 'genres' && (
            <p className="text-sm text-muted-foreground">
              Tip: Select between 3 and 5 genres to get more accurate recommendations
            </p>
          )}
          {currentQuestion.id === 'era' && (
            <p className="text-sm text-muted-foreground">
              Choose 1-3 eras that appeal to you most
            </p>
          )}
          {(currentQuestion.id === 'mood' || currentQuestion.id === 'rating') && (
            <p className="text-sm text-muted-foreground">
              Choose the option that best describes you
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <QuestionRenderer 
            question={currentQuestion}
            answer={getCurrentAnswer()?.answer}
            onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button 
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button 
            onClick={completeQuiz}
            disabled={!isCurrentQuestionAnswered()}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 w-full sm:w-auto order-1 sm:order-2"
            size="lg"
          >
            Complete Quiz
            <Play className="w-4 h-4" />
          </Button>
        ) : (
          <Button 
            onClick={nextQuestion}
            disabled={!isCurrentQuestionAnswered()}
            className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2"
            size="lg"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Question Renderer Component
function QuestionRenderer({ 
  question, 
  answer, 
  onAnswer 
}: { 
  question: QuizQuestion; 
  answer: any; 
  onAnswer: (answer: any) => void;
}) {
  const handleMultipleChoice = (option: string) => {
    const currentAnswers = Array.isArray(answer) ? answer : [];
    
    if (currentAnswers.includes(option)) {
      onAnswer(currentAnswers.filter(a => a !== option));
    } else {
      onAnswer([...currentAnswers, option]);
    }
  };

  const handleSingleChoice = (option: string) => {
    onAnswer(option);
  };

  switch (question.type) {
    case 'multiple-choice':
      return (
        <div className="grid gap-3">
          {question.options?.map((option, index) => {
            const isSelected = Array.isArray(answer) ? answer.includes(option) : answer === option;
            
            return (
              <button
                key={index}
                onClick={() => {
                  if (question.id === 'mood' || question.id === 'rating') {
                    handleSingleChoice(option);
                  } else {
                    handleMultipleChoice(option);
                  }
                }}
                className={`group relative p-4 text-left rounded-xl transition-all duration-200 hover:shadow-md ${
                  isSelected 
                    ? 'bg-primary/10 shadow-sm' 
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 w-4 h-4 rounded-full transition-all duration-200 ${
                    isSelected 
                      ? 'bg-primary' 
                      : 'bg-muted group-hover:bg-primary/30'
                  }`}>
                    {isSelected && (
                      <div className="w-full h-full rounded-full bg-primary-foreground scale-50"></div>
                    )}
                  </div>
                  <span className={`text-sm font-medium leading-relaxed ${
                    isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      );

    default:
      return null;
  }
}

 