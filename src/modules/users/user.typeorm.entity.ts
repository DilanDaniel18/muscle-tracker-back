import { Entity, PrimaryColumn, Column } from 'typeorm';
import { UserSex } from './user.entity.js';

@Entity({ name: 'UsersMT' })
export class UserEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  name!: string;

  @Column({ name: 'lastName', type: 'varchar', length: 36 })
  lastName!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ name: 'birthDate', type: 'date', nullable: true })
  birthDate!: Date | string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight!: number | string | null;

  @Column({ type: 'int', nullable: true })
  height!: number | null;

  @Column({ type: 'enum', enum: ['M', 'F', 'O'], nullable: true })
  sex!: UserSex | null;
}
