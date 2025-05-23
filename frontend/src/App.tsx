import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import readXlsxFile from 'read-excel-file';
import { Modal } from './components/Modal';
import bg from './assets/bg5.jpg';

interface PhysicsData {
  branch: string;
  topic: string;
  subtopic: string;
  description: string;
}

type ScrollableElement = HTMLElement;
type ItemRefs = Record<string, ScrollableElement | null>;

function App() {
  const [physicsExpanded, setPhysicsExpanded] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [expandedSubtopic, setExpandedSubtopic] = useState<string | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);
  const [physicsData, setPhysicsData] = useState<PhysicsData[]>([]);
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState<number>(-1);
  const [currentSubtopicList, setCurrentSubtopicList] = useState<{subtopic: string, description: string}[]>([]);
  const itemRefs = useRef<ItemRefs>({});

  useEffect(() => {
    fetch('/data.xlsx')
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
        return readXlsxFile(arrayBuffer, { sheet: 'Sheet1' });
      })
      .then((rows) => {
        const dataRows = rows.slice(1); // Skip header row
        const parsedData: PhysicsData[] = [];

        dataRows.forEach((row) => {
          const branch = row[0]?.toString() || '';
          const topic = row[1]?.toString() || '';
          const subtopic = row[2]?.toString() || '';
          const description = row[3]?.toString() || '';

          if (branch && subtopic) {
            parsedData.push({
              branch,
              topic,
              subtopic,
              description
            });
          }
        });

        setPhysicsData(parsedData);
      })
      .catch((error) => {
        console.error('Error reading Excel file:', error);
      });
  }, []);

  const scrollToItem = (id: string) => {
    if (!id.startsWith('branch-') && !id.startsWith('topic-')) return;

    setTimeout(() => {
      const element = itemRefs.current[id];
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 0);
  };

  const handlePhysicsClick = () => {
    setPhysicsExpanded(!physicsExpanded);
    if (!physicsExpanded) {
      setExpandedBranch(null);
      setExpandedTopic(null);
      setExpandedSubtopic(null);
    }
  };

  const handleBranchClick = (branch: string) => {
    const isSameBranch = expandedBranch === branch;
    setExpandedBranch(isSameBranch ? null : branch);
    setExpandedTopic(null);
    setExpandedSubtopic(null);
    scrollToItem(`branch-${branch}`);
  };

  const handleTopicClick = (topic: string) => {
    setExpandedTopic(expandedTopic === topic ? null : topic);
    setExpandedSubtopic(null);
    scrollToItem(`topic-${topic}`);
  };

  const handleSubtopicClick = (subtopic: string, description: string, branch: string, topic?: string) => {
    setExpandedSubtopic(expandedSubtopic === subtopic ? null : subtopic);
    setSelectedDescription(description);
    
    // Get all subtopics for the current branch/topic
    let subtopics: {subtopic: string, description: string}[] = [];
    
    if (topic) {
      subtopics = physicsData
        .filter(item => item.branch === branch && item.topic === topic)
        .map(item => ({ subtopic: item.subtopic, description: item.description }));
    } else {
      subtopics = physicsData
        .filter(item => item.branch === branch && !item.topic)
        .map(item => ({ subtopic: item.subtopic, description: item.description }));
    }
    
    setCurrentSubtopicList(subtopics);
    
    // Find current index
    const index = subtopics.findIndex(item => item.subtopic === subtopic);
    setCurrentSubtopicIndex(index);
  };

  const handlePreviousTopic = () => {
    if (currentSubtopicIndex > 0) {
      const prevIndex = currentSubtopicIndex - 1;
      const prevSubtopic = currentSubtopicList[prevIndex];
      setCurrentSubtopicIndex(prevIndex);
      setExpandedSubtopic(prevSubtopic.subtopic);
      setSelectedDescription(prevSubtopic.description);
    }
  };

  const handleNextTopic = () => {
    if (currentSubtopicIndex < currentSubtopicList.length - 1) {
      const nextIndex = currentSubtopicIndex + 1;
      const nextSubtopic = currentSubtopicList[nextIndex];
      setCurrentSubtopicIndex(nextIndex);
      setExpandedSubtopic(nextSubtopic.subtopic);
      setSelectedDescription(nextSubtopic.description);
    } else {
      // Last subtopic reached
      setCurrentSubtopicIndex(-1);
      setSelectedDescription(null);
    }
  };

  // Get unique branches
  const branches = [...new Set(physicsData.map(item => item.branch))];

  // Get topics for a branch (returns null if branch has no topics)
  const getTopics = (branch: string): string[] | null => {
    const topics = [...new Set(
      physicsData
        .filter(item => item.branch === branch && item.topic)
        .map(item => item.topic)
    )];
    return topics.length > 0 ? topics : null;
  };

  // Check if branch has direct subtopics (no topics)
  const hasDirectSubtopics = (branch: string): boolean => {
    return physicsData.some(item => item.branch === branch && !item.topic);
  };

  // Get direct subtopics for a branch (no topics)
  const getDirectSubtopics = (branch: string) => {
    return physicsData
      .filter(item => item.branch === branch && !item.topic)
      .map(item => ({
        subtopic: item.subtopic,
        description: item.description
      }));
  };

  const setItemRef = (id: string) => (el: ScrollableElement | null) => {
    if (el) {
      itemRefs.current[id] = el;
    } else {
      delete itemRefs.current[id];
    }
  };

  return (
    <div className="min-h-screen bg-[#161616] p-4 md:p-8 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="max-w-4xl mx-auto mt-7">
        {/* Physics Button */}
        <div className="mb-6">
          <button
            onClick={handlePhysicsClick}
            className="btn btn-glow w-full rounded-lg p-4 flex items-center justify-between transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="text-white group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-white">পদার্থবিজ্ঞান</span>
            </div>
            {physicsExpanded ? (
              <ChevronDown className="text-white" />
            ) : (
              <ChevronRight className="text-white" />
            )}
          </button>
        </div>

        {/* Branches List */}
        {physicsExpanded && (
          <div className="space-y-4 animate-fade-in">
            {branches.map((branch) => {
              const topics = getTopics(branch);
              const hasDirectSubs = hasDirectSubtopics(branch);
              
              return (
                <div 
                  key={branch}
                  id={`branch-${branch}`}
                  ref={setItemRef(`branch-${branch}`)}
                >
                  <button
                    onClick={() => handleBranchClick(branch)}
                    className="sub-glow w-full p-4 flex items-center justify-between rounded-lg transition-all duration-200"
                  >
                    <span className="text-xl font-semibold text-white">{branch}</span>
                    {expandedBranch === branch ? (
                      <ChevronDown className="text-white" />
                    ) : (
                      <ChevronRight className="text-white" />
                    )}
                  </button>

                  {expandedBranch === branch && (
                    <div className="px-4 pb-4 space-y-2 animate-fade-in mt-2">
                      {/* Render topics if they exist */}
                      {topics && topics.map((topic) => (
                        <div 
                          key={`${branch}-${topic}`} 
                          id={`topic-${topic}`}
                          ref={setItemRef(`topic-${topic}`)}
                          className="ml-4"
                        >
                          <button
                            onClick={() => handleTopicClick(topic)}
                            className="btn1 sub-glow chapter-glow w-full p-3 flex items-center justify-between text-sm rounded-lg transition-all duration-200"
                          >
                            <span className="text-lg font-semibold text-white">{topic}</span>
                            {expandedTopic === topic ? (
                              <ChevronDown className="text-white" size={18} />
                            ) : (
                              <ChevronRight className="text-white" size={18} />
                            )}
                          </button>

                          {expandedTopic === topic && (
                            <div className="ml-4 mt-2 space-y-2">
                              {physicsData
                                .filter(item => item.branch === branch && item.topic === topic)
                                .map((item) => (
                                  <button
                                    key={item.subtopic}
                                    onClick={() => handleSubtopicClick(item.subtopic, item.description, branch, topic)}
                                    className="topic-glow bdr w-full p-2 text-left text-sm font-semibold rounded-lg transition-all duration-200"
                                  >
                                    <span className="text-white">{item.subtopic}</span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Render direct subtopics if no topics exist */}
                      {!topics && hasDirectSubs && (
                        <div className="ml-4 mt-2 space-y-2">
                          {getDirectSubtopics(branch).map((item) => (
                            <button
                              key={item.subtopic}
                              onClick={() => handleSubtopicClick(item.subtopic, item.description, branch)}
                              className="bdr topic-glow w-full p-2 text-left font-semibold text-sm rounded-lg transition-all duration-200"
                            >
                              <span className="text-white">{item.subtopic}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Description Modal */}
        <Modal
          isOpen={selectedDescription !== null}
          onClose={() => {
            setSelectedDescription(null);
            setCurrentSubtopicIndex(-1);
          }}
          title={expandedSubtopic || ''}
          description={selectedDescription || ''}
          onPreviousTopic={handlePreviousTopic}
          onNextTopic={handleNextTopic}
          showPreviousButton={currentSubtopicIndex > 0}
          showNextButton={currentSubtopicIndex < currentSubtopicList.length - 1}
         
        />
      </div>
    </div>
  );
}

export default App;