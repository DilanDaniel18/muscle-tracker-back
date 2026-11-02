import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserSex } from '../users/user.entity.js';

@Entity({ name: 'UserProfilesMT' })
export class OnboardingProfileEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'userId', type: 'varchar', length: 36, unique: true })
  userId!: string;

  @Column({ name: 'birthDate', type: 'date' })
  birthDate!: Date | string;

  @Column({ type: 'int' })
  height!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weight!: number | string;

  @Column({ type: 'enum', enum: ['M', 'F', 'O'] })
  sex!: UserSex;

  @Column({ name: 'activityTypes', type: 'json' })
  activityTypes!: string[];

  @Column({ name: 'isBeginner', type: 'boolean', default: false })
  isBeginner!: boolean;

  @Column({ name: 'exerciseFrequency', type: 'varchar', length: 64 })
  exerciseFrequency!: string;

  @Column({ name: 'onboardingCompleted', type: 'boolean', default: true })
  onboardingCompleted!: boolean;

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt!: Date;
}

