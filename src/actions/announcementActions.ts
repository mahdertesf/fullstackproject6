// src/actions/announcementActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Announcement, AnnouncementTargetAudience, User } from '@prisma/client';
import type { AnnouncementGeneratorFormData } from '@/lib/schemas';

export async function createAnnouncement(
  data: AnnouncementGeneratorFormData, 
  authorId: number,
  availableSectionsForMapping?: { id: string, name: string }[]
): Promise<Announcement> {
  try {
    const targetSectionIds = (data.selectedSections && availableSectionsForMapping)
      ? data.selectedSections
          .map(idStr => parseInt(idStr))
          .filter(id => !isNaN(id))
      : [];

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title: data.topic, // Assuming topic is used as title for now, or AI generates it
        content: `Content for: ${data.topic}`, // Placeholder, real content comes from AI
        author_id: authorId,
        desired_tone: data.desiredTone,
        target_audience: data.targetAudience as AnnouncementTargetAudience, // Cast, ensure schema matches
        status: 'Published', // Or 'Draft' then publish separately
        publish_date: new Date(),
        targetSections: targetSectionIds.length > 0 ? {
          create: targetSectionIds.map(sectionId => ({
            scheduled_course_id: sectionId,
          })),
        } : undefined,
      },
      include: {
        targetSections: true,
      }
    });
    // TODO: Audit log
    return newAnnouncement;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw new Error('Failed to create announcement.');
  }
}

export async function getAnnouncementsForUser(user: User): Promise<Announcement[]> {
  const now = new Date();
  let targetAudiences: AnnouncementTargetAudience[] = ['AllUsers'];
  if (user.role === 'Student') targetAudiences.push('Students');
  if (user.role === 'Teacher') targetAudiences.push('Teachers');
  if (user.role === 'Staff') targetAudiences.push('Staff');

  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        status: 'Published',
        publish_date: { lte: now },
        OR: [
          { expiry_date: { gte: now } },
          { expiry_date: null },
        ],
        AND: [
          {
            OR: [
              { target_audience: { in: targetAudiences } },
              // If user is a student/teacher, also fetch announcements targeted to their specific sections
              // This requires knowing the user's scheduled_course_ids.
              // This part can be complex and might need a different query strategy or post-fetch filtering.
              // For now, keeping it simpler by audience.
            ]
          }
        ]
      },
      include: {
        author: { select: { first_name: true, last_name: true, username: true }},
        targetSections: { include: { scheduledCourse: { select: { course_id: true, section_number: true } } } }
      },
      orderBy: { publish_date: 'desc' },
      take: 10, // Limit for dashboards/recent views
    });
    return announcements;
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}
