import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { topicService } from '@/services/topicService';
import { configService, CONFIG_KEYS } from '@/services/configService';

interface TopicContextType {
  topic: string | null;
  getTopicParam: () => string;
  isReady: boolean;
}

const TopicContext = createContext<TopicContextType | undefined>(undefined);

export function TopicProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const initTopic = async () => {
      const topicParam = searchParams.get('topic');
      console.log('TopicContext - Current topic param:', topicParam, 'Path:', location.pathname);
      
      if (topicParam) {
        setTopic(topicParam);
        hasRedirected.current = true;
        setIsReady(true);
      } else if (!hasRedirected.current) {
        // No topic parameter and haven't redirected yet - redirect all users to default topic
        try {
          // Get default topic from config (cached for speed)
          const defaultTopic = await configService.get<string>(CONFIG_KEYS.DEFAULT_TOPIC);
          console.log('TopicContext - Default topic from config:', defaultTopic);
          
          if (defaultTopic) {
            setTopic(defaultTopic);
            hasRedirected.current = true;
            // Navigate to home with topic parameter
            navigate(`/?topic=${encodeURIComponent(defaultTopic)}`, { replace: true });
          } else {
            // Fallback to latest topic if config not set
            const latestTopic = await topicService.getLatestTopic();
            console.log('TopicContext - Fallback to latest topic:', latestTopic);
            if (latestTopic) {
              setTopic(latestTopic.title);
              hasRedirected.current = true;
              navigate(`/?topic=${encodeURIComponent(latestTopic.title)}`, { replace: true });
            }
          }
          setIsReady(true);
        } catch (error) {
          console.error('Error fetching default topic:', error);
          setIsReady(true);
        }
      } else {
        setIsReady(true);
      }
    };
    
    initTopic();
  }, [location.pathname, location.search, navigate, searchParams]);

  const getTopicParam = () => {
    return topic ? `?topic=${encodeURIComponent(topic)}` : '';
  };

  // Show loading while initializing
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <TopicContext.Provider value={{ topic, getTopicParam, isReady }}>
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
