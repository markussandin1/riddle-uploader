interface CreatedQuiz {
  id: string;
  uuid: string;
  title: string;
  viewUrl: string | null;
  created: string;
  published: boolean;
  publishedAt: string | null;
  sourceRequest?: string; // Original trigger title/site
  timestamp: string;
}

class QuizStore {
  private quizzes: CreatedQuiz[] = [];

  addQuiz(quiz: Omit<CreatedQuiz, 'id' | 'timestamp'>): CreatedQuiz {
    const newQuiz: CreatedQuiz = {
      ...quiz,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    
    this.quizzes.unshift(newQuiz); // Add to beginning
    
    // Keep only last 50 quizzes to prevent memory issues
    if (this.quizzes.length > 50) {
      this.quizzes = this.quizzes.slice(0, 50);
    }
    
    return newQuiz;
  }

  getQuizzes(limit: number = 20): CreatedQuiz[] {
    return this.quizzes.slice(0, limit);
  }

  getQuizByUuid(uuid: string): CreatedQuiz | undefined {
    return this.quizzes.find(quiz => quiz.uuid === uuid);
  }

  clear(): void {
    this.quizzes = [];
  }
}

// Export singleton instance
export const quizStore = new QuizStore();
export type { CreatedQuiz };