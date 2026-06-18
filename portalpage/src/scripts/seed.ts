import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding portal_auth database...');

  const adminPassword = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'teerapat.tan@ww.co.th' },
    update: {},
    create: {
      email: 'teerapat.tan@ww.co.th',
      name: 'Teerapat Tan',
      password: adminPassword,
      avatarColor: '#6366f1',
      portalRole: 'SUPER_ADMIN',
      projectAccess: {
        create: [
          { projectId: 'account_a_team', role: 'SUPERADMIN' },
          { projectId: 'management_tracking', role: 'ADMIN' },
          { projectId: 'team_performance', role: 'ADMIN' },
        ],
      },
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);
  console.log('   Password: Admin@1234  (เปลี่ยนหลัง login ครั้งแรก)');
  console.log('\n📋 โปรเจกค์ทั้งหมด:');
  console.log('   - account_a_team    → Roles: SUPERADMIN, ADMIN, USER');
  console.log('   - management_tracking → Roles: ADMIN, PM, SUPERVISOR, TECHNICIAN, OUTSOURCED');
  console.log('   - team_performance  → Roles: ADMIN, MANAGER, VIEWER');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
