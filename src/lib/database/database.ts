import Dexie, { Table } from 'dexie';
import CryptoJS from 'crypto-js';
import type {
  User,
  Conversation,
  Character,
  CharacterConversation,
  Memory,
  CheckIn,
  FamilyMember,
  Reminder,
  CustomCalendar,
  Event,
  LifeTemplate,
  Emotion
} from './schema';

// Database encryption key - in production, this should be derived from user's password
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_DB_ENCRYPTION_KEY || 'myai-default-key-change-in-production';

export class MyAiDatabase extends Dexie {
  // Tables
  users!: Table<User, string>;
  conversations!: Table<Conversation, string>;
  characters!: Table<Character, string>;
  characterConversations!: Table<CharacterConversation, string>;
  memory!: Table<Memory, string>;
  checkIns!: Table<CheckIn, string>;
  family!: Table<FamilyMember, string>;
  reminders!: Table<Reminder, string>;
  customCalendars!: Table<CustomCalendar, string>;
  events!: Table<Event, string>;
  lifeTemplates!: Table<LifeTemplate, string>;
  emotions!: Table<Emotion, string>;

  constructor() {
    super('MyAiDB');

    this.version(1).stores({
      users: 'id, email, createdAt, lastActiveAt',
      conversations: 'id, userId, title, createdAt, updatedAt',
      characters: 'id, userId, name, isActive, createdAt, updatedAt',
      characterConversations: 'id, userId, characterId, title, createdAt, updatedAt',
      memory: 'id, userId, type, importance, createdAt, updatedAt',
      checkIns: 'id, userId, date, mood, createdAt',
      family: 'id, userId, name, relationship, birthday, createdAt, updatedAt',
      reminders: 'id, userId, title, dueDate, priority, status, createdAt, completedAt',
      customCalendars: 'id, userId, name, category, isDefault, isVisible, createdAt, updatedAt',
      events: 'id, userId, calendarId, title, startDate, endDate, type, status, priority, createdAt, updatedAt',
      lifeTemplates: 'id, userId, name, category, isActive, createdAt, updatedAt',
      emotions: 'id, userId, name, intensity, timestamp, checkInId'
    });
  }
}

export class LocalDatabase {
  private static instance: LocalDatabase;
  private db: MyAiDatabase;
  private isInitialized = false;

  private constructor() {
    this.db = new MyAiDatabase();
  }

  static getInstance(): LocalDatabase {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
    }
    return LocalDatabase.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.db.open();
      this.isInitialized = true;
      console.log('Local database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async saveToStorage(): Promise<void> {
    // Dexie handles persistence automatically
    // This method is kept for compatibility but doesn't need to do anything
    return Promise.resolve();
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      id: this.generateUserId(),
      createdAt: Date.now(),
      ...userData,
    };

    await this.db.users.add(user);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return await this.db.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await this.db.users.where('email').equals(email).first();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await this.db.users.update(id, updates);
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.users.delete(id);
  }

  // Conversation operations
  async createConversation(conversation: Conversation): Promise<void> {
    await this.db.conversations.add(conversation);
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    return await this.db.conversations.get(id);
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    const conversations = await this.db.conversations
      .where('userId')
      .equals(userId)
      .toArray();
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    await this.db.conversations.update(id, updates);
  }

  async deleteConversation(id: string): Promise<void> {
    await this.db.conversations.delete(id);
  }

  async searchConversations(userId: string, query: string): Promise<Conversation[]> {
    const allConversations = await this.getConversationsByUser(userId);
    return allConversations.filter(conv =>
      conv.title.toLowerCase().includes(query.toLowerCase()) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(query.toLowerCase()))
    );
  }

  // Character operations
  async createCharacter(character: Character): Promise<void> {
    await this.db.characters.add(character);
  }

  async getCharacterById(id: string): Promise<Character | undefined> {
    return await this.db.characters.get(id);
  }

  async getCharactersByUser(userId: string): Promise<Character[]> {
    return await this.db.characters
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<void> {
    await this.db.characters.update(id, updates);
  }

  async deleteCharacter(id: string): Promise<void> {
    // Also delete character conversations
    await this.db.characterConversations.where('characterId').equals(id).delete();
    await this.db.characters.delete(id);
  }

  // Character conversation operations
  async createCharacterConversation(conversation: CharacterConversation): Promise<void> {
    await this.db.characterConversations.add(conversation);
  }

  async getCharacterConversationById(id: string): Promise<CharacterConversation | undefined> {
    return await this.db.characterConversations.get(id);
  }

  async getCharacterConversations(characterId: string): Promise<CharacterConversation[]> {
    return await this.db.characterConversations
      .where('characterId')
      .equals(characterId)
      .reverse()
      .sortBy('updatedAt');
  }

  async updateCharacterConversation(id: string, updates: Partial<CharacterConversation>): Promise<void> {
    await this.db.characterConversations.update(id, updates);
  }

  async deleteCharacterConversation(id: string): Promise<void> {
    await this.db.characterConversations.delete(id);
  }

  // Memory operations
  async createMemory(memory: Memory): Promise<void> {
    await this.db.memory.add(memory);
  }

  async getMemoryById(id: string): Promise<Memory | undefined> {
    return await this.db.memory.get(id);
  }

  async getMemoriesByUser(userId: string): Promise<Memory[]> {
    return await this.db.memory
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
  }

  async updateMemory(id: string, updates: Partial<Memory>): Promise<void> {
    await this.db.memory.update(id, updates);
  }

  async deleteMemory(id: string): Promise<void> {
    await this.db.memory.delete(id);
  }

  async searchMemories(userId: string, query: string): Promise<Memory[]> {
    const allMemories = await this.getMemoriesByUser(userId);
    return allMemories.filter(memory =>
      memory.content.toLowerCase().includes(query.toLowerCase()) ||
      memory.summary.toLowerCase().includes(query.toLowerCase()) ||
      memory.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }

  // Check-in operations
  async createCheckIn(checkIn: CheckIn): Promise<void> {
    await this.db.checkIns.add(checkIn);
  }

  async getCheckInById(id: string): Promise<CheckIn | undefined> {
    return await this.db.checkIns.get(id);
  }

  async getCheckInsByUser(userId: string, limit?: number): Promise<CheckIn[]> {
    const checkIns = await this.db.checkIns
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('date');

    if (limit) {
      return checkIns.slice(0, limit);
    }

    return checkIns;
  }

  async updateCheckIn(id: string, updates: Partial<CheckIn>): Promise<void> {
    await this.db.checkIns.update(id, updates);
  }

  async deleteCheckIn(id: string): Promise<void> {
    await this.db.checkIns.delete(id);
  }

  // Family operations
  async createFamilyMember(member: FamilyMember): Promise<void> {
    await this.db.family.add(member);
  }

  async getFamilyMemberById(id: string): Promise<FamilyMember | undefined> {
    return await this.db.family.get(id);
  }

  async getFamilyMembersByUser(userId: string): Promise<FamilyMember[]> {
    return await this.db.family
      .where('userId')
      .equals(userId)
      .sortBy('name');
  }

  async updateFamilyMember(id: string, updates: Partial<FamilyMember>): Promise<void> {
    await this.db.family.update(id, updates);
  }

  async deleteFamilyMember(id: string): Promise<void> {
    await this.db.family.delete(id);
  }

  // Reminder operations
  async createReminder(reminder: Reminder): Promise<void> {
    await this.db.reminders.add(reminder);
  }

  async getRemindersByUser(userId: string): Promise<Reminder[]> {
    return await this.db.reminders
      .where('userId')
      .equals(userId)
      .sortBy('createdAt');
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
    await this.db.reminders.update(id, updates);
  }

  async deleteReminder(id: string): Promise<void> {
    await this.db.reminders.delete(id);
  }

  // Calendar operations
  async createCalendar(calendar: CustomCalendar): Promise<void> {
    await this.db.customCalendars.add(calendar);
  }

  async getCalendarById(id: string): Promise<CustomCalendar | undefined> {
    return await this.db.customCalendars.get(id);
  }

  async getUserCalendars(userId: string): Promise<CustomCalendar[]> {
    return await this.db.customCalendars
      .where('userId')
      .equals(userId)
      .sortBy('createdAt');
  }

  async updateCalendar(id: string, updates: Partial<CustomCalendar>): Promise<void> {
    await this.db.customCalendars.update(id, updates);
  }

  async deleteCalendar(id: string): Promise<void> {
    await this.db.customCalendars.delete(id);
  }

  // Event operations
  async createEvent(event: Event): Promise<void> {
    await this.db.events.add(event);
  }

  async getEventById(id: string): Promise<Event | undefined> {
    return await this.db.events.get(id);
  }

  async getUserEvents(userId: string, startDate?: number, endDate?: number): Promise<Event[]> {
    let query = this.db.events.where('userId').equals(userId);

    if (startDate && endDate) {
      query = query.filter(event => event.startDate >= startDate && event.startDate <= endDate);
    }

    return await query.sortBy('startDate');
  }

  async getUpcomingEvents(userId: string, daysAhead: number, limit: number): Promise<Event[]> {
    const now = Date.now();
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;

    return await this.db.events
      .where('userId')
      .equals(userId)
      .and(event => event.startDate >= now && event.startDate <= futureDate)
      .limit(limit)
      .sortBy('startDate');
  }

  async getBills(userId: string, year: number, month: number): Promise<Event[]> {
    const startDate = new Date(year, month - 1, 1).getTime();
    const endDate = new Date(year, month, 0, 23, 59, 59).getTime();

    return await this.db.events
      .where('userId')
      .equals(userId)
      .and(event => event.type === 'bill' && event.startDate >= startDate && event.startDate <= endDate)
      .sortBy('startDate');
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    await this.db.events.update(id, updates);
  }

  async deleteEvent(id: string): Promise<void> {
    await this.db.events.delete(id);
  }

  // Life Template operations
  async createLifeTemplate(template: LifeTemplate): Promise<void> {
    await this.db.lifeTemplates.add(template);
  }

  async getUserTemplates(userId: string): Promise<LifeTemplate[]> {
    return await this.db.lifeTemplates.where({ userId }).sortBy('createdAt');
  }

  async updateLifeTemplate(id: string, updates: Partial<LifeTemplate>): Promise<void> {
    await this.db.lifeTemplates.update(id, updates);
  }

  async deleteLifeTemplate(id: string): Promise<void> {
    await this.db.lifeTemplates.delete(id);
  }

  // Utility methods
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export/Import functionality
  async exportDatabase(): Promise<string> {
    const data = {
      users: await this.db.users.toArray(),
      conversations: await this.db.conversations.toArray(),
      characters: await this.db.characters.toArray(),
      characterConversations: await this.db.characterConversations.toArray(),
      memory: await this.db.memory.toArray(),
      checkIns: await this.db.checkIns.toArray(),
      family: await this.db.family.toArray(),
      reminders: await this.db.reminders.toArray(),
      customCalendars: await this.db.customCalendars.toArray(),
      events: await this.db.events.toArray(),
      lifeTemplates: await this.db.lifeTemplates.toArray(),
      emotions: await this.db.emotions.toArray(),
    };

    return this.encrypt(JSON.stringify(data));
  }

  async importDatabase(encryptedData: string): Promise<void> {
    try {
      const data = JSON.parse(this.decrypt(encryptedData));

      // Clear existing data
      await this.clearDatabase();

      // Import all data
      if (data.users) await this.db.users.bulkAdd(data.users);
      if (data.conversations) await this.db.conversations.bulkAdd(data.conversations);
      if (data.characters) await this.db.characters.bulkAdd(data.characters);
      if (data.characterConversations) await this.db.characterConversations.bulkAdd(data.characterConversations);
      if (data.memory) await this.db.memory.bulkAdd(data.memory);
      if (data.checkIns) await this.db.checkIns.bulkAdd(data.checkIns);
      if (data.family) await this.db.family.bulkAdd(data.family);
      if (data.reminders) await this.db.reminders.bulkAdd(data.reminders);
      if (data.customCalendars) await this.db.customCalendars.bulkAdd(data.customCalendars);
      if (data.events) await this.db.events.bulkAdd(data.events);
      if (data.lifeTemplates) await this.db.lifeTemplates.bulkAdd(data.lifeTemplates);
      if (data.emotions) await this.db.emotions.bulkAdd(data.emotions);

      console.log('Database imported successfully');
    } catch (error) {
      console.error('Failed to import database:', error);
      throw error;
    }
  }

  async clearDatabase(): Promise<void> {
    await this.db.users.clear();
    await this.db.conversations.clear();
    await this.db.characters.clear();
    await this.db.characterConversations.clear();
    await this.db.memory.clear();
    await this.db.checkIns.clear();
    await this.db.family.clear();
    await this.db.reminders.clear();
    await this.db.customCalendars.clear();
    await this.db.events.clear();
    await this.db.lifeTemplates.clear();
    await this.db.emotions.clear();
  }

  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  }

  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Get database size estimation
  getDatabaseSize(): string {
    // This is an estimation since we can't easily get actual IndexedDB size
    return "Local Storage"; // Placeholder
  }
}

// Export singleton instance
export const localDB = LocalDatabase.getInstance();
