import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

interface TopicContextType {
  topic: string | null;
  getTopicParam: () => string;
}

const TopicContext = createContext<TopicContextType | undefined>(undefined);

export function TopicProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState<string | null>(null);

  useEffect(() => {
    const topicParam = searchParams.get('topic');
    if (topicParam) {
      setTopic(topicParam);
    }
  }, [searchParams]);

  const getTopicParam = () => {
    return topic ? `?topic=${topic}` : '';
  };

  return (
    <TopicContext.Provider value={{ topic, getTopicParam }}>
      {children}
    </TopicContext.Provider>
  );
}

export function useTopic() {
  const context = useContext(TopicContext);
  if (context === undefined) {
    throw new Error('useTopic must be used within a TopicProvider');
  }
  return context;
}
