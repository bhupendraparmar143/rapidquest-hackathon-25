/**
 * Seed Data Script
 * Populates the database with sample teams, users, and queries for testing
 * Run with: node server/scripts/seedData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('../models/Team');
const User = require('../models/User');
const Query = require('../models/Query');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/query_management';

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    await Team.deleteMany({});
    await User.deleteMany({});
    await Query.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Teams
    const supportTeam = new Team({
      name: 'Customer Support',
      description: 'Handles general customer inquiries and support',
      handlesTags: ['question', 'request', 'feedback'],
      handlesChannels: ['email', 'chat', 'phone'],
      handlesPriorities: ['low', 'medium', 'high']
    });
    await supportTeam.save();

    const technicalTeam = new Team({
      name: 'Technical Support',
      description: 'Handles technical issues and bugs',
      handlesTags: ['technical_issue', 'complaint'],
      handlesChannels: ['email', 'chat', 'community'],
      handlesPriorities: ['medium', 'high', 'urgent']
    });
    await technicalTeam.save();

    const billingTeam = new Team({
      name: 'Billing & Payments',
      description: 'Handles billing inquiries and payment issues',
      handlesTags: ['billing', 'request', 'complaint'],
      handlesChannels: ['email', 'phone'],
      handlesPriorities: ['medium', 'high', 'urgent']
    });
    await billingTeam.save();

    console.log('✅ Created teams');

    // Create Users
    const users = [
      {
        name: 'Alice Johnson',
        email: 'alice@company.com',
        role: 'agent',
        team: supportTeam._id
      },
      {
        name: 'Bob Smith',
        email: 'bob@company.com',
        role: 'agent',
        team: supportTeam._id
      },
      {
        name: 'Charlie Brown',
        email: 'charlie@company.com',
        role: 'specialist',
        team: technicalTeam._id
      },
      {
        name: 'Diana Prince',
        email: 'diana@company.com',
        role: 'specialist',
        team: technicalTeam._id
      },
      {
        name: 'Eve Wilson',
        email: 'eve@company.com',
        role: 'agent',
        team: billingTeam._id
      },
      {
        name: 'Frank Miller',
        email: 'frank@company.com',
        role: 'manager',
        team: supportTeam._id
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('✅ Created users');

    // Create Sample Queries
    const sampleQueries = [
      {
        subject: 'Product not working after update',
        content: 'I updated the app yesterday and now it crashes every time I try to open it. This is very frustrating and I need this fixed urgently!',
        channel: 'email',
        senderName: 'John Customer',
        senderEmail: 'john@example.com',
        receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        subject: 'Question about pricing',
        content: 'Hi, I would like to know more about your pricing plans. Can you send me information about the different tiers?',
        channel: 'chat',
        senderName: 'Sarah User',
        senderEmail: 'sarah@example.com',
        receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      },
      {
        subject: 'Billing issue - charged twice',
        content: 'I was charged twice for my subscription this month. Please refund the duplicate charge immediately.',
        channel: 'email',
        senderName: 'Mike Subscriber',
        senderEmail: 'mike@example.com',
        receivedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        subject: 'Great product!',
        content: 'Just wanted to say thank you for such an amazing product. It has really helped our team be more productive.',
        channel: 'social_media',
        senderName: 'Happy Customer',
        senderEmail: null,
        receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        subject: 'Feature request',
        content: 'It would be great if you could add dark mode support. Many users have been asking for this feature.',
        channel: 'community',
        senderName: 'Community Member',
        senderEmail: null,
        receivedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      },
      {
        subject: 'URGENT: System down',
        content: 'Our entire system is down and we cannot access any of our data. This is critical and needs immediate attention!',
        channel: 'phone',
        senderName: 'Enterprise Client',
        senderEmail: 'enterprise@company.com',
        receivedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        subject: 'How to export data?',
        content: 'I need to export my data but cannot find the export option. Can someone help me with this?',
        channel: 'email',
        senderName: 'Data User',
        senderEmail: 'data@example.com',
        receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      },
      {
        subject: 'Complaint about service',
        content: 'I have been waiting for a response for over 48 hours. This is unacceptable customer service. I want to speak to a manager.',
        channel: 'email',
        senderName: 'Dissatisfied Customer',
        senderEmail: 'dissatisfied@example.com',
        receivedAt: new Date(Date.now() - 50 * 60 * 60 * 1000) // 50 hours ago
      }
    ];

    // Import services to apply auto-tagging and priority
    const taggingService = require('../services/taggingService');
    const priorityService = require('../services/priorityService');
    const routingService = require('../services/routingService');

    for (const queryData of sampleQueries) {
      const query = new Query(queryData);
      
      // Apply auto-tagging
      await taggingService.applyTagsToQuery(query);
      
      // Apply priority detection
      await priorityService.applyPriorityToQuery(query);
      
      // Auto-assign (optional - comment out if you want queries to remain unassigned)
      await routingService.autoRouteAndAssign(query);
      
      await query.save();
    }

    console.log('✅ Created sample queries');
    console.log('\n📊 Summary:');
    console.log(`   - Teams: ${await Team.countDocuments()}`);
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Queries: ${await Query.countDocuments()}`);
    console.log('\n✨ Seed data created successfully!');
    console.log('🚀 You can now start the application and view the data.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedData();


