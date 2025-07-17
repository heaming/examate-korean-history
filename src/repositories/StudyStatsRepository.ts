import dayjs from 'dayjs';
import { StudyStats } from '../types/database';
import { BaseRepository } from './BaseRepository';

export class StudyStatsRepository extends BaseRepository<StudyStats> {
  constructor() {
    super();
  }

  async initializeTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS study_stats (
        id INTEGER PRIMARY KEY DEFAULT 1,
        studyStreak INTEGER NOT NULL DEFAULT 0,
        lastStudyDate TEXT,
        totalStudyTime INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL DEFAULT (date('now')),
        updatedAt TEXT DEFAULT DEFAULT (date('now')),
      )
    `;
    
    await this.executeQuery(sql);

    const existingRecord = await this.getStats();
    if (!existingRecord) {
      await this.createDefaultStats();
    }
  }

  async getStats(): Promise<StudyStats | null> {
    const sql = 'SELECT * FROM study_stats WHERE id = 1';
    const result = await this.executeQuery(sql);
    
    if (!result.rows.length) return null;
    
    const row = result.rows.item(0);
    return {
      id: row.id,
      studyStreak: row.studyStreak,
      lastStudyDate: row.lastStudyDate,
      totalStudyTime: row.totalStudyTime,
      createAt: row.createAt,
      updatedAt: row.updatedAt,
    };
  }

  async updateStats(stats: Partial<StudyStats>): Promise<void> {
    const updateFields = [];
    const values = [];

    if (stats.totalStudyTime !== undefined) {
      updateFields.push('totalStudyTime = ?');
      values.push(stats.totalStudyTime);
    }
    
    if (stats.studyStreak !== undefined) {
      updateFields.push('studyStreak = ?');
      values.push(stats.studyStreak);
    }
    
    if (stats.lastStudyDate !== undefined) {
      updateFields.push('lastStudyDate = ?');
      values.push(stats.lastStudyDate);
    }
    
    if (updateFields.length === 0) return;
    
    updateFields.push(`updatedAt =  (date('now'))`);
    
    const sql = `
      UPDATE study_stats 
      SET ${updateFields.join(', ')}
      WHERE id = 1
    `;
    
    await this.executeQuery(sql, values);
  }

  async updateStudyStreak(streakCount: number): Promise<void> {
    const sql = `
      UPDATE study_stats 
      SET studyStreak = ?,
          lastStudyDate = ?,
          updatedAt =  (date('now'))
      WHERE id = 1
    `;
    
    await this.executeQuery(sql, [streakCount, dayjs().format('YYYY-MM-DD')]);
  }

  async addStudyTime(minutes: number): Promise<void> {
    const sql = `
      UPDATE study_stats 
      SET totalStudyTime = totalStudyTime + ?,
          updatedAt =  (date('now'))
      WHERE id = 1
    `;
    
    await this.executeQuery(sql, [minutes]);
  }

  private async createDefaultStats(): Promise<void> {
    const now = dayjs().format('YYYY-MM-DD');
    const sql = `
      INSERT INTO study_stats (
        id,
        studyStreak, 
        lastStudyDate,
        totalStudyTime,
        createdAt,
        updatedAt       
      )
      VALUES (1, 0, '', 0, now, now);
    `;
    
    await this.executeQuery(sql);
  }

  // BaseRepository 추상 메서드 구현
  async findAll(): Promise<StudyStats[]> {
    const stats = await this.getStats();
    return stats ? [stats] : [];
  }

  async findById(id: string | number): Promise<StudyStats | null> {
    if (Number(id) === 1) {
      return await this.getStats();
    }
    return null;
  }

  async create(data: Omit<StudyStats, 'id'>): Promise<StudyStats> {
    await this.updateStats(data);
    const stats = await this.getStats();
    if (!stats) {
      throw new Error('Failed to create study stats');
    }
    return stats;
  }

  async update(id: string | number, data: Partial<StudyStats>): Promise<StudyStats> {
    await this.updateStats(data);
    const stats = await this.getStats();
    if (!stats) {
      throw new Error('Failed to update study stats');
    }
    return stats;
  }

  async delete(id: string | number): Promise<boolean> {
    // 학습 통계는 삭제하지 않고 초기화만 함
    await this.updateStats({
      studyStreak: 0,
      lastStudyDate: '',
      totalStudyTime: 0
    });
    return true;
  }
} 