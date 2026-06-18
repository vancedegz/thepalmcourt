import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clean existing data
  await prisma.payment.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.court.deleteMany()
  await prisma.pricingTier.deleteMany()
  await prisma.businessSettings.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10)
  const staffPassword = await bcrypt.hash('staff123', 10)
  const customerPassword = await bcrypt.hash('customer123', 10)

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@thepalmcourt.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      status: 'active',
    },
  })

  const staff = await prisma.user.create({
    data: {
      username: 'staff',
      email: 'staff@thepalmcourt.com',
      passwordHash: staffPassword,
      firstName: 'Staff',
      lastName: 'User',
      role: 'staff',
      status: 'active',
    },
  })

  const customer = await prisma.user.create({
    data: {
      username: 'customer',
      email: 'customer@example.com',
      passwordHash: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer',
      status: 'active',
      phone: '+1234567890',
    },
  })

  // Create business settings
  await prisma.businessSettings.create({
    data: {
      name: 'The Palm Court',
      logoUrl: 'https://hyrwy9xec9.ufs.sh/f/0efuR0hwb0QyWwEIYatMroMZ2QKbfuBX34Y5cNptxEj6a9DR',
      email: 'info@thepalmcourt.com',
      phone: '+63 917 123 4567',
      address: 'General Santos, Philippines',
      openingTime: '06:00',
      closingTime: '22:00',
      defaultPricePerHour: 250,
      bookingRules: 'Bookings must be made at least 1 hour in advance. Cancellations must be made at least 2 hours before the booking time. Walk-ins welcome based on availability.',
      paymentInstructions: 'Please upload a screenshot of your payment confirmation after booking. Payments will be verified within 24 hours. GCash and bank transfer accepted.',
      bankDetails: 'GCash: 0917-123-4567\nBank: BDO\nAccount Name: The Palm Court\nAccount Number: 1234567890',
    },
  })

  // Create pricing tiers
  await prisma.pricingTier.createMany({
    data: [
      {
        name: 'Morning',
        startTime: '06:00',
        endTime: '12:00',
        pricePerHour: 200,
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
      {
        name: 'Afternoon',
        startTime: '12:00',
        endTime: '18:00',
        pricePerHour: 250,
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
      {
        name: 'Evening',
        startTime: '18:00',
        endTime: '22:00',
        pricePerHour: 300,
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
    ],
  })

  // Create courts
  await prisma.court.createMany({
    data: [
      {
        name: 'Court 1',
        number: 1,
        description: 'Premium court with tropical vibes and professional surface',
        status: 'active',
      },
      {
        name: 'Court 2',
        number: 2,
        description: 'Main court with excellent lighting and palm tree views',
        status: 'active',
      },
      {
        name: 'Court 3',
        number: 3,
        description: 'Relaxed atmosphere court perfect for casual games',
        status: 'active',
      },
    ],
  })

  console.log('Database seeded successfully!')
  console.log('Created users:')
  console.log('- admin / admin123 (admin)')
  console.log('- staff / staff123 (staff)')
  console.log('- customer / customer123 (customer)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
