const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create or Reset Company Settings
  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {
      companyName: 'Fizz PR Agency',
    },
    create: {
      id: 'default',
      companyName: 'Fizz PR Agency',
      workingDays: 'MON,TUE,WED,THU,FRI',
      officeStartTime: '09:30 AM',
      officeEndTime: '06:30 PM',
      gracePeriod: 15,
      halfDayRules: 'Clock in after 01:00 PM counts as half-day',
      leaveTypes: 'CASUAL,SICK,EARNED,EMERGENCY,OTHER',
      leaveAllowance: 12,
      carryForwardRules: 'Up to 5 unused leaves can be carried forward',
      taskStatuses: 'ASSIGNED,IN_PROGRESS,REVIEW,COMPLETED,OVERDUE',
      priorityLevels: 'LOW,MEDIUM,HIGH,URGENT',
    },
  });
  console.log('Company settings seeded.');

  // Clean up all data
  await prisma.notification.deleteMany({});
  await prisma.taskComment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.wfhRequest.deleteMany({});
  await prisma.attendance.deleteMany({});
  
  await prisma.department.updateMany({ data: { managerId: null } });
  await prisma.user.updateMany({ data: { departmentId: null, managerId: null } });
  
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleaned up existing database tables.');

  // 2. Hash new superadmin password
  const passwordHash = await bcrypt.hash('Superadmin@726', 10);

  // 3. Create Default Department
  const mgmtDept = await prisma.department.create({
    data: { name: 'Management' }
  });
  console.log('Default Management department created.');

  // 4. Create Super Admin User
  const superadmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@vspark.com',
      passwordHash,
      role: 'ADMIN',
      employeeId: 'EMP-001',
      designation: 'CEO',
      departmentId: mgmtDept.id,
      joiningDate: new Date('2024-01-15'),
      annualLeaveAllowance: 15,
    }
  });

  // Assign superadmin as department manager
  await prisma.department.update({
    where: { id: mgmtDept.id },
    data: { managerId: superadmin.id }
  });

  console.log('Super Admin seeded successfully:', superadmin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
