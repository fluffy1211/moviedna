'use client';

import { useState } from 'react';
import QuizComponent from '@/components/quiz/QuizComponent';
import MovieRecommendations from '@/components/quiz/MovieRecommendations';
import { MoviePreferences, QuizCompletionResult } from '@/lib/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, LogIn, User, Brain, Dna } from 'lucide-react';

export default function QuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizResult, setQuizResult] = useState<QuizCompletionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  console.log('Quiz page session:', { session, status });

  const handleQuizComplete = async (preferences: MoviePreferences, answers: Record<string, any>) => {
    if (isProcessing) return; // Prevent double submission
    
    setIsProcessing(true);
    try {
      console.log('Submitting quiz completion...', { preferences, answers });
      
      const response = await fetch('/api/quiz/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences,
          answers
        }),
      });

      console.log('Quiz completion response:', response.status);

      if (response.ok) {
        const result: QuizCompletionResult = await response.json();
        console.log('Quiz completed successfully, redirecting...');
        // Redirect to results page instead of showing inline
        router.push('/quiz/results');
      } else {
        const errorText = await response.text();
        console.error('Error completing quiz:', response.status, errorText);
        alert(`Failed to complete quiz (${response.status}). Please try again.`);
        // Don't reset quiz state on error
      }
    } catch (error) {
      console.error('Error saving quiz results:', error);
      alert('An error occurred while completing the quiz. Please try again.');
      // Don't reset quiz state on error
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="page-container section-padding min-h-[calc(100vh-160px)] flex items-center justify-center">
        <Card className="max-w-lg w-full shadow-lg bg-card/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center space-y-4 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Checking your session</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page-container section-padding min-h-[calc(100vh-160px)] flex items-center justify-center">
        <Card className="max-w-md w-full shadow-lg bg-card/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center space-y-6 p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Login Required</h3>
              <p className="text-muted-foreground">
                You need to log in to discover your MovieDNA
              </p>
            </div>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isProcessing) {
    return (
      <main className="page-container section-padding min-h-[calc(100vh-160px)] flex items-center justify-center">
        <Card className="max-w-lg w-full shadow-lg bg-card/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center space-y-6 p-8 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary border-t-transparent"></div>
              <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Analyzing your MovieDNA...</h3>
              <p className="text-muted-foreground leading-relaxed">
                We're analyzing your preferences and finding the perfect recommendations for you.
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (quizResult) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-background via-background to-muted/20">
        <MovieRecommendations result={quizResult} />
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-background via-background to-muted/20">
      <div className="page-container section-padding">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Brain className="w-4 h-4" />
              <span>Quiz MovieDNA</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="heading-1">
                Discover your 
                <span className="text-gradient"> MovieDNA</span>
              </h1>
              <p className="subtitle max-w-2xl mx-auto">
                Answer a few questions about your movie preferences and get 
                a personalized profile with tailored recommendations.
              </p>
            </div>

            {/* Features Preview */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 bg-muted/30 backdrop-blur-sm rounded-full px-4 py-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Personalized Questions</span>
              </div>
              <div className="flex items-center gap-2 bg-muted/30 backdrop-blur-sm rounded-full px-4 py-2">
                <Dna className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Unique Profile</span>
              </div>
              <div className="flex items-center gap-2 bg-muted/30 backdrop-blur-sm rounded-full px-4 py-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Accurate Results</span>
              </div>
            </div>
          </div>
          
          {/* Quiz Component */}
          <div className="animate-fade-in">
            <QuizComponent onComplete={handleQuizComplete} />
          </div>
        </div>
      </div>
    </main>
  );
}
