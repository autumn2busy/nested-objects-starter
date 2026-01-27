import React, { useState, useCallback, useMemo } from 'react';
import { 
  Brain, ChevronLeft, ChevronRight, RotateCcw, 
  Star, Check, X, Shuffle, BookOpen, Award,
  Eye, EyeOff, Filter, Search
} from 'lucide-react';

/**
 * NESTED OBJECTS - FLASHCARD DECK
 * Module 1: 74 flashcards from flashcards.xlsx
 * 
 * Categories:
 * - Photography: 35
 * - Client Interaction: 7
 * - Safety & Hazards: 6
 * - General: 5
 * - Property Location: 4
 * - Field Kit: 4
 * - File Management: 3
 * - Technology: 3
 * - Vehicle & Parking: 3
 * - Appearance: 2
 * - Time Management: 1
 * - Exterior Inspection: 1
 */

const flashcardData = [
  { id: 1, question: "What are the MINIMUM and PREFERRED photo sizes?", answer: "The minimum size is 1024x768, and the preferred size is 1600x1200.", category: "Photography" },
  { id: 2, question: "What photo ratio setting is required by the checklist?", answer: "The required photo ratio setting is 4:3.", category: "Photography" },
  { id: 3, question: "What is the required orientation for all photos according to the checklist?", answer: "All photos should be HORIZONTAL, with no vertical photos.", category: "Photography" },
  { id: 4, question: "What two things must NOT be included in any inspection photos?", answer: "Photos must not include people or time/date stamps.", category: "Photography" },
  { id: 5, question: "If you encounter a dangerous liability concern like a hole in the roof, what are the two immediate actions you must take?", answer: "You must take a photo of the item and then contact your FIM and/or Customer Service to describe it.", category: "Safety & Hazards" },
  { id: 6, question: "List the six 'Basic Photos' required in a standard exterior inspection.", answer: "Address/House Numbers, Front, Back, Left, Right, and a Close-Up of Roof.", category: "Photography" },
  { id: 7, question: "What specific hazard related to steps requires photographic documentation?", answer: "Step hazards, specifically missing rails on both sides for steps 10 inches or higher.", category: "Safety & Hazards" },
  { id: 8, question: "What is the maximum allowable baluster spacing for decks, steps, and porches before it is considered a hazard?", answer: "Baluster spacing greater than 4 inches is considered a hazard.", category: "Safety & Hazards" },
  { id: 9, question: "When mapping an address and being unable to locate it, how many mapping programs are required to be used?", answer: "Three different mapping programs are required.", category: "Property Location" },
  { id: 10, question: "Before closing out a case as 'Unable to locate' from the office, how many calls must be made and to whom?", answer: "Three calls must be made to the insured and one call to the agent on different days/times.", category: "Property Location" },
  { id: 11, question: "What is a key best practice regarding parking when arriving at an insured's property?", answer: "Park on the street when possible.", category: "Client Interaction" },
  { id: 12, question: "According to best practices, when should you begin taking photos at a property?", answer: "You should not take any photos until after you have knocked on the door to see if the insured is present.", category: "Client Interaction" },
  { id: 13, question: "What is the correct procedure if an insured person is upset and asks you to leave?", answer: "Apologize for the inconvenience and leave the property immediately without taking more photos or measurements.", category: "Client Interaction" },
  { id: 14, question: "Where should an inspector NEVER leave a door hanger?", answer: "Never inside a mailbox or between the door and the frame.", category: "Client Interaction" },
  { id: 15, question: "The recommended file naming pattern for inspection photos is ORDERID_ADDRESSCODE_SECTION_SEQUENCE_______.jpg.", answer: "DESC (Description)", category: "File Management" },
  { id: 16, question: "What is the recommended filename for the fifth interior photo of a kitchen at 742 Pine street, order ID 123456?", answer: "123456_742PINE_INT_05_Kitchen.jpg", category: "File Management" },
  { id: 17, question: "What should be stored in the '05-UploadProof' subfolder for each order?", answer: "Portal confirmation screenshots should be stored in this folder.", category: "File Management" },
  { id: 18, question: "According to the 'Lighting & Framing Guide,' what is the difference between a 'Context shot' and a 'Detail shot'?", answer: "A context shot shows where you are (e.g., the side of a house), while a detail shot moves closer to the specific subject (e.g., an area of damage).", category: "Photography" },
  { id: 19, question: "What framing rule is critical for maintaining a professional look in architectural photos?", answer: "Keep vertical lines vertical and avoid tilting the camera.", category: "Photography" },
  { id: 20, question: "What is the self-check quality control question an inspector should ask about their photos?", answer: "Can someone else identify the location and condition without reading your notes?", category: "Photography" },
  { id: 21, question: "What is a common characteristic of a 'bad' address photo, as shown in the examples?", answer: "The house number is cropped, blurry, or unreadable.", category: "Photography" },
  { id: 22, question: "A 'good' damage photo set includes a wide wall shot and a close-up that features what important element?", answer: "A scale reference, such as a ruler or measuring tape.", category: "Photography" },
  { id: 23, question: "What common mistake in bathroom photos should be avoided?", answer: "Capturing your own reflection in the mirror (a 'mirror selfie').", category: "Photography" },
  { id: 24, question: "According to the photo standards, what is a key indicator of occupancy that can be photographed without showing people's faces?", answer: "Documenting indicators like cars in the driveway, trash cans, or well-kept porch furniture.", category: "Photography" },
  { id: 25, question: "What is the primary rule for the 'Vehicle-to-door quick grab' bag layout?", answer: "Everything you need for the first 5 minutes must be reachable in under 10 seconds.", category: "Field Kit" },
  { id: 26, question: "What is the recommended loop for efficiently photographing a property's exterior?", answer: "Start at the front for the address shot, move clockwise or counter-clockwise around the property (Left, Rear, Right), and end with a street view.", category: "Photography" },
  { id: 27, question: "What piece of core tech is recommended to deal with dead zones or poor cell service?", answer: "A backup phone or an optional hotspot device.", category: "Technology" },
  { id: 28, question: "What is the purpose of carrying a small ruler in an inspector's field kit?", answer: "To provide a scale reference in photos of damage.", category: "Field Kit" },
  { id: 29, question: "What is the recommended style of 'disarming clothing' for a field inspector?", answer: "Khakis, a polo shirt, a neutral jacket, and closed-toe shoes.", category: "Appearance" },
  { id: 30, question: "Why is it important for an inspector to wear clothing with no large logos or 'tactical cosplay' appearance?", answer: "To look boring and legitimate, avoiding any appearance that might cause alarm or mistrust.", category: "Appearance" },
  { id: 31, question: "What should an inspector check on their device regarding time before starting an inspection?", answer: "Ensure photo timestamps are enabled and the device time is set correctly.", category: "Time Management" },
  { id: 32, question: "What must be enabled on a device if the inspection portal uses GPS validation?", answer: "Location services must be enabled.", category: "Property Location" },
  { id: 33, question: "Which two interview questions on the checklist are specific to AFI/American Family 360 orders only?", answer: "The questions about dead bolt locks and the number of bathrooms/second-story laundry room.", category: "Client Interaction" },
  { id: 34, question: "What are inspectors explicitly told NEVER to look at or photograph inside of?", answer: "Inside of any windows or mailboxes on the home or outbuildings.", category: "Photography" },
  { id: 35, question: "What piece of equipment from the checklist is essential for inspections in active construction zones?", answer: "A hard hat.", category: "Field Kit" },
  { id: 36, question: "The recommended file naming pattern specifies using _____ to represent the property damage.", answer: "DMG", category: "Photography" },
  { id: 37, question: "What is the recommended daily backup strategy for inspection photos?", answer: "At the end of the day, copy the folders to a second location, such as an external drive or a cloud service.", category: "Photography" },
  { id: 38, question: "When taking photos in dark interiors, what technique can prevent 'blown highlights' from the flash?", answer: "Step back slightly from the subject.", category: "Photography" },
  { id: 39, question: "A bad front-of-property photo might be taken from the driver's seat with glare. What is the 'good' alternative?", answer: "A straight-on, level shot that includes the walkway.", category: "Photography" },
  { id: 40, question: "If a fence blocks the view of the rear of a property, what should an inspector do?", answer: "Document the obstruction and attempt to get an alternate angle.", category: "General" },
  { id: 41, question: "What is the proper way to document a utility meter?", answer: "Provide a clear, readable photo of the meter face plus a context shot showing its location on the property.", category: "General" },
  { id: 42, question: "What are examples of 'vacant indicators' that can be photographed as evidence?", answer: "Photos of empty rooms, no furnishings, or overgrown yards.", category: "Photography" },
  { id: 43, question: "The recommended interior photo flow starts at the Entry and proceeds to the Living room and then the _____.", answer: "Kitchen", category: "Photography" },
  { id: 44, question: "What item is listed in the 'Autumn's Field Kit' for dealing with long rural routes with no facilities?", answer: "Urinal bags.", category: "Field Kit" },
  { id: 45, question: "Under what circumstance is an inspector authorized to use HUD keys or lockbox keys?", answer: "Only when explicitly authorized by the work order.", category: "General" },
  { id: 46, question: "What two items from the checklist are examples of recreational equipment that must be documented as potential hazards?", answer: "Pools and trampolines.", category: "Safety & Hazards" },
  { id: 47, question: "Any body of water, including standing water and drainage ditches, must be photographed if it is within what distance of the property?", answer: "Within 1000 feet.", category: "Photography" },
  { id: 48, question: "What professional identification must an inspector ALWAYS have visible while on a property?", answer: "An ID visible on the outer side of their shirt, jacket, or coat.", category: "General" },
  { id: 49, question: "What is the recommended minimum power capacity for a portable phone charger/power bank according to the checklist?", answer: "10,000mAh minimum.", category: "Technology" },
  { id: 50, question: "If you are unable to locate a home in the field, what photos should you take to prove your location?", answer: "Photos of the surrounding addresses and the cross street or street sign.", category: "Photography" },
  { id: 51, question: "What should be done with raw original photos according to the backup SOPs?", answer: "They should be kept untouched; only export copies for any allowed edits.", category: "Photography" },
  { id: 52, question: "What type of photo should be taken for ALL signs on a property?", answer: "A close-up photo of the sign itself.", category: "Photography" },
  { id: 53, question: "Besides the structure itself, what hazard related to trees must be documented?", answer: "Trees that are touching, overhanging, or showing signs of rot near the home.", category: "Safety & Hazards" },
  { id: 54, question: "What is the defining characteristic of a 'good' interior photo compared to a 'bad' one, based on the visual examples?", answer: "Good lighting, sharpness, and proper exposure, whereas the bad one is dark and blurry.", category: "Photography" },
  { id: 55, question: "Based on the visual examples, what distinguishes a 'good' utility meter photo from a 'bad' one?", answer: "The numbers on the good meter are sharp and clearly legible, while they are blurry on the bad one.", category: "Photography" },
  { id: 56, question: "What key detail is present in the 'Good damage.png' image that is missing from the 'Bad Damage.png' image?", answer: "A scale reference (a measuring tape) to show the size of the damage.", category: "Photography" },
  { id: 57, question: "In the interview, what information is requested about any dogs on the property?", answer: "The breed, temperament, and whether there is a bite history.", category: "Safety & Hazards" },
  { id: 58, question: "What hazard is specifically mentioned in relation to porches or decks that are 3 feet or more off the ground?", answer: "Missing rails.", category: "Exterior Inspection" },
  { id: 59, question: "What type of app is recommended in the checklist for expense reporting?", answer: "A mileage tracking app.", category: "Technology" },
  { id: 60, question: "What is the recommended folder structure for organizing files for a single inspection order?", answer: "One main folder per order ID, with subfolders for Exterior, Interior, Damage, Docs, and UploadProof.", category: "Photography" },
  { id: 61, question: "If you have to use a flashlight for a night exterior shot of an address, how many photos should you take and what should they show?", answer: "Two photos: one wide shot and one tight (close-up) shot.", category: "Photography" },
  { id: 62, question: "What must be documented about any detached structures on a property?", answer: "Photos of all detached structures are required as part of the basic photos.", category: "General" },
  { id: 63, question: "The checklist requires documenting what type of vehicles if found on the property?", answer: "Disabled or untagged vehicles.", category: "Vehicle & Parking" },
  { id: 64, question: "What action should be taken regarding personal property belonging to the insured?", answer: "Never touch the insured's personal property.", category: "Client Interaction" },
  { id: 65, question: "If you have to call an agent because you cannot locate a property, what are the restrictions on when you can call?", answer: "Call agents only Monday through Friday during business hours (9 am - 5 pm).", category: "Property Location" },
  { id: 66, question: "In the 'Autumn's Field Kit', a high-visibility vest is recommended for what specific situations?", answer: "For inspections at roadside locations or on construction sites.", category: "Vehicle & Parking" },
  { id: 67, question: "What is a 'good' way to document neighbor interactions if policy allows?", answer: "Make an anonymous note such as 'neighbor stated...' without recording names.", category: "Client Interaction" },
  { id: 68, question: "According to the 'Photo Standard Examples', what should be photographed to show a pool area correctly?", answer: "The full pool area as well as its safety gate and/or cover.", category: "Photography" },
  { id: 69, question: "What is the key element of a 'good' address verification photo set?", answer: "A tight shot of the numbers plus a wider shot showing the numbers on the property for context.", category: "Photography" },
  { id: 70, question: "The checklist recommends carrying a clipboard with a _____.", answer: "weatherproof cover", category: "Vehicle & Parking" },
  { id: 71, question: "When documenting peeling paint, what is required besides just a photo of the paint?", answer: "It is listed under 'Hazard Photos', implying context is needed to show where on the structure it is.", category: "Photography" },
  { id: 72, question: "What is the protocol for documenting business or commercial exposure during the interview?", answer: "It is question #9 on the interview form, requiring a yes/no answer.", category: "Photography" },
  { id: 73, question: "What should an inspector do if a client has specific photo requirements that contradict the general instructions?", answer: "Follow the specific customer requirements, as they can overrule any of the general instructions.", category: "Photography" },
  { id: 74, question: "What is the primary purpose of a well-organized field kit, according to Autumn's guide?", answer: "To reduce rework, improve safety, and create consistent evidence that survives quality control.", category: "Field Kit" },
];

// Category colors
const categoryColors = {
  "Photography": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  "Client Interaction": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  "Safety & Hazards": { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  "General": { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  "Property Location": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  "Field Kit": { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  "File Management": { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
  "Technology": { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  "Vehicle & Parking": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  "Appearance": { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
  "Time Management": { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  "Exterior Inspection": { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
};

const FlashcardDeck = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState('all');
  const [starredCards, setStarredCards] = useState(new Set());
  const [reviewCards, setReviewCards] = useState(new Set());
  const [masteredCards, setMasteredCards] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [shuffledCards, setShuffledCards] = useState(null);

  // Get unique categories
  const categories = useMemo(() => 
    [...new Set(flashcardData.map(c => c.category))].sort(),
  []);

  // Get filtered cards
  const filteredCards = useMemo(() => {
    let cards = shuffledCards || flashcardData;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      cards = cards.filter(card => card.category === selectedCategory);
    }
    
    // Filter by study mode
    if (studyMode === 'starred') {
      cards = cards.filter(card => starredCards.has(card.id));
    } else if (studyMode === 'review') {
      cards = cards.filter(card => reviewCards.has(card.id));
    } else if (studyMode === 'mastered') {
      cards = cards.filter(card => masteredCards.has(card.id));
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(card => 
        card.question.toLowerCase().includes(query) ||
        card.answer.toLowerCase().includes(query)
      );
    }
    
    return cards;
  }, [shuffledCards, selectedCategory, studyMode, starredCards, reviewCards, masteredCards, searchQuery]);

  const currentCard = filteredCards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
    }, 150);
  };

  const handleShuffle = () => {
    const shuffled = [...flashcardData].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const toggleStar = (cardId) => {
    setStarredCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const markAsReview = () => {
    if (currentCard) {
      setReviewCards(prev => new Set([...prev, currentCard.id]));
      const newMastered = new Set(masteredCards);
      newMastered.delete(currentCard.id);
      setMasteredCards(newMastered);
    }
    handleNext();
  };

  const markAsMastered = () => {
    if (currentCard) {
      setMasteredCards(prev => new Set([...prev, currentCard.id]));
      const newReview = new Set(reviewCards);
      newReview.delete(currentCard.id);
      setReviewCards(newReview);
    }
    handleNext();
  };

  const resetProgress = () => {
    setStarredCards(new Set());
    setReviewCards(new Set());
    setMasteredCards(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
    setShuffledCards(null);
    setSelectedCategory('all');
    setSearchQuery('');
  };

  // Empty state
  if (filteredCards.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Cards Found</h3>
        <p className="text-slate-500 mb-4">
          {studyMode === 'starred' ? "You haven't starred any cards yet." : 
           studyMode === 'review' ? "No cards marked for review." :
           studyMode === 'mastered' ? "No cards mastered yet." :
           searchQuery ? "No cards match your search." :
           "No cards in this category."}
        </p>
        <button
          onClick={() => { setStudyMode('all'); setSelectedCategory('all'); setSearchQuery(''); }}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
        >
          View All Cards
        </button>
      </div>
    );
  }

  const categoryColor = currentCard ? (categoryColors[currentCard.category] || categoryColors["General"]) : categoryColors["General"];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-600" />
              Module 1 Flashcards
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {flashcardData.length} terms to master
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 rounded-lg">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">{masteredCards.size}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 rounded-lg">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">{reviewCards.size}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 rounded-lg">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">{starredCards.size}</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentIndex(0); }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Study Mode */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {[
              { id: 'all', label: 'All', count: flashcardData.length },
              { id: 'starred', label: 'Starred', count: starredCards.size },
              { id: 'review', label: 'Review', count: reviewCards.size },
              { id: 'mastered', label: 'Mastered', count: masteredCards.size },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => { setStudyMode(mode.id); setCurrentIndex(0); setIsFlipped(false); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  studyMode === mode.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode.label} ({mode.count})
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentIndex(0); setIsFlipped(false); }}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Categories ({flashcardData.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat} ({flashcardData.filter(c => c.category === cat).length})
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleShuffle}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Shuffle cards"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={resetProgress}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Reset progress"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      {currentCard && (
        <div className="relative">
          {/* Card Counter */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-full">
            {currentIndex + 1} / {filteredCards.length}
          </div>

          {/* The Card */}
          <div
            className="relative h-80 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className={`absolute inset-0 transition-all duration-500 ${isFlipped ? 'opacity-0 rotate-y-180' : 'opacity-100'}`}
              style={{ backfaceVisibility: 'hidden', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
            >
              {/* Front (Question) */}
              <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 flex flex-col shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColor.bg} ${categoryColor.text}`}>
                    {currentCard.category}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(currentCard.id); }}
                    className={`p-2 rounded-full transition ${
                      starredCards.has(currentCard.id)
                        ? 'bg-yellow-500 text-white'
                        : 'bg-slate-700 text-slate-400 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-4 h-4" fill={starredCards.has(currentCard.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <span className="text-emerald-400 text-sm font-medium mb-3">QUESTION</span>
                  <p className="text-xl text-white leading-relaxed">
                    {currentCard.question}
                  </p>
                </div>

                <p className="text-slate-500 text-sm text-center">
                  Click to reveal answer
                </p>
              </div>
            </div>

            <div
              className={`absolute inset-0 transition-all duration-500 ${isFlipped ? 'opacity-100' : 'opacity-0 rotate-y-180'}`}
              style={{ backfaceVisibility: 'hidden', transform: isFlipped ? 'rotateY(0)' : 'rotateY(-180deg)' }}
            >
              {/* Back (Answer) */}
              <div className="h-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-2xl p-8 flex flex-col shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                    {currentCard.category}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(currentCard.id); }}
                    className={`p-2 rounded-full transition ${
                      starredCards.has(currentCard.id)
                        ? 'bg-yellow-500 text-white'
                        : 'bg-emerald-800 text-emerald-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-4 h-4" fill={starredCards.has(currentCard.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <span className="text-emerald-200 text-sm font-medium mb-3">ANSWER</span>
                  <p className="text-xl text-white leading-relaxed">
                    {currentCard.answer}
                  </p>
                </div>

                <p className="text-emerald-200/70 text-sm text-center">
                  Click to flip back
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>

            {/* Progress Dots */}
            <div className="flex items-center gap-1">
              {filteredCards.slice(
                Math.max(0, currentIndex - 3),
                Math.min(filteredCards.length, currentIndex + 4)
              ).map((card, i) => {
                const actualIndex = Math.max(0, currentIndex - 3) + i;
                return (
                  <button
                    key={card.id}
                    onClick={() => { setCurrentIndex(actualIndex); setIsFlipped(false); }}
                    className={`h-2 rounded-full transition-all ${
                      actualIndex === currentIndex
                        ? 'w-6 bg-emerald-500'
                        : masteredCards.has(card.id)
                        ? 'w-2 bg-emerald-300'
                        : reviewCards.has(card.id)
                        ? 'w-2 bg-amber-400'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                );
              })}
            </div>

            <button
              onClick={handleNext}
              className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {currentCard && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={markAsReview}
            className="flex-1 max-w-xs py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Need to Review
          </button>
          <button
            onClick={markAsMastered}
            className="flex-1 max-w-xs py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Got It!
          </button>
        </div>
      )}

      {/* Quick Reference List */}
      <details className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <summary className="px-5 py-4 cursor-pointer hover:bg-slate-50 transition flex items-center justify-between">
          <span className="font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            Quick Reference (All {flashcardData.length} Cards)
          </span>
        </summary>
        <div className="px-5 pb-5 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {flashcardData.map((card) => {
              const color = categoryColors[card.category] || categoryColors["General"];
              return (
                <div
                  key={card.id}
                  className={`p-3 rounded-lg border ${color.border} ${color.bg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">{card.question}</p>
                      <p className="text-sm text-slate-600 mt-1">{card.answer}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {masteredCards.has(card.id) && <Check className="w-4 h-4 text-emerald-600" />}
                      {reviewCards.has(card.id) && <RotateCcw className="w-4 h-4 text-amber-600" />}
                      {starredCards.has(card.id) && <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </details>
    </div>
  );
};

export default FlashcardDeck;
