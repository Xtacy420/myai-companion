// Local SQLite Database Schema
// Local database schema using SQLite with Dexie

export interface User {
  id: string;
  name?: string;
  email?: string;
  profilePicture?: string;
  timezone?: string;
  bio?: string;
  location?: string;
  createdAt: number;
  lastActiveAt?: number;

  // AI Personality settings
  aiPersonality?: {
    tone: string;
    style: string;
    traits: string[];
    responseLength: string;
    emotionalDepth: number;
    memoryFocus: string;
  };

  // Cloud sync settings
  cloudSync?: {
    enabled: boolean;
    provider: string;
    syncToken?: string;
    lastSync?: number;
    encryptionKey?: string;
    autoSyncInterval?: string;
    lastSyncTime?: number;
  };

  // User settings
  settings?: {
    notifications: {
      enabled: boolean;
      sound: boolean;
      desktop: boolean;
      reminders: boolean;
      updates: boolean;
    };
    appearance: {
      theme: 'light' | 'dark' | 'system';
      fontSize: 'small' | 'medium' | 'large';
      animations: boolean;
    };
    privacy: {
      analytics: boolean;
      crashReports: boolean;
      dataCollection: boolean;
    };
    advanced: {
      debugMode: boolean;
      betaFeatures: boolean;
      autoBackup: boolean;
    };
  };
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: number;
  }>;
  createdAt: number;
  updatedAt: number;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  description: string;
  personality: {
    traits: string[];
    tone: string;
    expertise: string[];
    responseStyle: string;
  };
  avatar?: string;
  backstory?: string;
  conversationCount: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CharacterConversation {
  id: string;
  userId: string;
  characterId: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: number;
  }>;
  createdAt: number;
  updatedAt: number;
}

export interface Memory {
  id: string;
  userId: string;
  type: string;
  content: string;
  summary: string;
  importance: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  metadata?: {
    context?: string;
    location?: string;
    emotion?: string;
    relatedPeople?: string[];
  };
}

export interface CheckIn {
  id: string;
  userId: string;
  date: string;
  mood: number;
  emotions: string[];
  notes?: string;
  activities?: string[];
  gratitude?: string[];
  goals?: string[];
  challenges?: string[];
  highlights?: string[];
  createdAt: number;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  birthday?: string;
  notes?: string;
  importantDates?: Array<{
    date: string;
    description: string;
    type: string;
  }>;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  preferences?: {
    interests?: string[];
    dislikes?: string[];
    giftIdeas?: string[];
  };
  createdAt: number;
  updatedAt: number;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: number;
  priority: string;
  category?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface CustomCalendar {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  category: string;
  isDefault: boolean;
  isVisible: boolean;
  settings?: {
    notifications: boolean;
    defaultDuration?: number;
    defaultReminder?: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface Event {
  id: string;
  userId: string;
  calendarId: string;
  title: string;
  description?: string;

  // Date and time
  startDate: number;
  endDate?: number;
  allDay: boolean;
  timezone?: string;

  // Event details
  type: string;
  status: string;
  priority: string;

  // Location and people
  location?: string;
  attendees?: string[];

  // Recurring settings
  recurring?: {
    frequency: string;
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: number;
    maxOccurrences?: number;
  };

  // Reminders
  reminders?: Array<{
    minutes: number;
    type: string;
  }>;

  // Task-specific fields
  completedAt?: number;
  subtasks?: Array<{
    title: string;
    completed: boolean;
    completedAt?: number;
  }>;

  // Bill-specific fields
  amount?: number;
  currency?: string;
  isPaid?: boolean;
  paidAt?: number;

  createdAt: number;
  updatedAt: number;
}

// First LifeTemplate interface removed to avoid conflicts

export interface Emotion {
  id: string;
  userId: string;
  name: string;
  intensity: number;
  context?: string;
  triggers?: string[];
  timestamp: number;
  checkInId?: string;
}

// Life template related interfaces
export interface LifeTemplate {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  category: string;
  areas: LifeArea[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LifeArea {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  goals: LifeGoalTemplate[];
  values: string[];
  milestones: LifeMilestone[];
}

export interface LifeGoalTemplate {
  title: string;
  type: string;
  timeframe: string;
}

export interface LifeGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category?: string;
  type: string;
  timeframe: string;
  status: string;
  priority: string;
  targetDate?: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface LifeValue {
  id: string;
  name: string;
  description?: string;
}

export interface LifeMilestone {
  title: string;
  description: string;
}

// Database table creation SQL
export const CREATE_TABLES_SQL = `
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    profilePicture TEXT,
    timezone TEXT,
    createdAt INTEGER NOT NULL,
    lastActiveAt INTEGER,
    aiPersonality TEXT,
    cloudSync TEXT
  );

  -- Conversations table
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    messages TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id)
  );

  -- Characters table
  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    personality TEXT NOT NULL,
    avatar TEXT,
    backstory TEXT,
    conversationCount INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id)
  );

  -- Character conversations table
  CREATE TABLE IF NOT EXISTS characterConversations (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    characterId TEXT NOT NULL,
    title TEXT NOT NULL,
    messages TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (characterId) REFERENCES characters (id)
  );

  -- Memory table
  CREATE TABLE IF NOT EXISTS memory (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT NOT NULL,
    importance INTEGER NOT NULL,
    tags TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    metadata TEXT,
    FOREIGN KEY (userId) REFERENCES users (id)
  );

  -- Check-ins table
  CREATE TABLE IF NOT EXISTS checkIns (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    date TEXT NOT NULL,
    mood INTEGER NOT NULL,
    emotions TEXT NOT NULL,
    notes TEXT,
    activities TEXT,
    gratitude TEXT,
    goals TEXT,
    challenges TEXT,
    highlights TEXT,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id)
  );

  -- Family members table
  CREATE TABLE IF NOT EXISTS family (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    birthday TEXT,
    notes TEXT,
    importantDates TEXT,
    contactInfo TEXT,
    preferences TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id)
  );

  -- Reminders table
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    dueDate INTEGER,
    priority TEXT NOT NULL,
    category TEXT,
    status TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    completedAt INTEGER,
    FOREIGN KEY (userId) REFERENCES users (id)
  );

  -- Custom calendars table
  CREATE TABLE IF NOT EXISTS customCalendars (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL,
    icon TEXT,
    category TEXT NOT NULL,
    isDefault INTEGER DEFAULT 0,
    isVisible INTEGER DEFAULT 1,
    settings TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id)
  );

  -- Events table
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    calendarId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    startDate INTEGER NOT NULL,
    endDate INTEGER,
    allDay INTEGER DEFAULT 0,
    timezone TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    location TEXT,
    attendees TEXT,
    recurring TEXT,
    reminders TEXT,
    completedAt INTEGER,
    subtasks TEXT,
    amount REAL,
    currency TEXT,
    isPaid INTEGER DEFAULT 0,
    paidAt INTEGER,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (calendarId) REFERENCES customCalendars (id)
  );

  -- Life templates table
  CREATE TABLE IF NOT EXISTS lifeTemplates (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    template TEXT NOT NULL,
    isActive INTEGER DEFAULT 1,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id)
  );

  -- Emotions table
  CREATE TABLE IF NOT EXISTS emotions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    intensity INTEGER NOT NULL,
    context TEXT,
    triggers TEXT,
    timestamp INTEGER NOT NULL,
    checkInId TEXT,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (checkInId) REFERENCES checkIns (id)
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations (userId);
  CREATE INDEX IF NOT EXISTS idx_characters_userId ON characters (userId);
  CREATE INDEX IF NOT EXISTS idx_characterConversations_userId ON characterConversations (userId);
  CREATE INDEX IF NOT EXISTS idx_characterConversations_characterId ON characterConversations (characterId);
  CREATE INDEX IF NOT EXISTS idx_memory_userId ON memory (userId);
  CREATE INDEX IF NOT EXISTS idx_checkIns_userId ON checkIns (userId);
  CREATE INDEX IF NOT EXISTS idx_family_userId ON family (userId);
  CREATE INDEX IF NOT EXISTS idx_reminders_userId ON reminders (userId);
  CREATE INDEX IF NOT EXISTS idx_customCalendars_userId ON customCalendars (userId);
  CREATE INDEX IF NOT EXISTS idx_events_userId ON events (userId);
  CREATE INDEX IF NOT EXISTS idx_events_calendarId ON events (calendarId);
  CREATE INDEX IF NOT EXISTS idx_events_startDate ON events (startDate);
  CREATE INDEX IF NOT EXISTS idx_lifeTemplates_userId ON lifeTemplates (userId);
  CREATE INDEX IF NOT EXISTS idx_emotions_userId ON emotions (userId);
  CREATE INDEX IF NOT EXISTS idx_emotions_timestamp ON emotions (timestamp);
`;
