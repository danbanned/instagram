const prisma = require('../config/prisma');
const Story = require('../models/Story');
const { toPublicMediaPath, getMediaType } = require('../services/storageService');
const { createNotification } = require('../services/notificationService');

async function getStoryTray(req, res) {
  try {
    const tray = await Story.getTray(req.user.id);
    res.json({ success: true, stories: tray });
  } catch (err) {
    console.error('Story tray error:', err);
    res.status(500).json({ error: 'Failed to load stories' });
  }
}

async function markStorySeen(req, res) {
  try {
    await Story.markSeen(req.params.storyId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Mark seen error:', err);
    res.status(500).json({ error: 'Failed to mark story as seen' });
  }
}

async function trackView(req, res) {
  try {
    const { tappedForward, tappedBackward, exited, completed } = req.body;
    const storyId = req.params.storyId;
    const userId = req.user.id;

    await prisma.storyView.upsert({
      where: { storyId_userId: { storyId, userId } },
      update: { tappedForward: !!tappedForward, tappedBackward: !!tappedBackward, exited: !!exited, completed: !!completed, viewedAt: new Date() },
      create: { storyId, userId, tappedForward: !!tappedForward, tappedBackward: !!tappedBackward, exited: !!exited, completed: !!completed },
    });

    // Also keep seenBy in sync
    await Story.markSeen(storyId, userId);

    res.json({ success: true });
  } catch (err) {
    console.error('Track view error:', err);
    res.status(500).json({ error: 'Failed to track view' });
  }
}

async function getUserStories(req, res) {
  try {
    const stories = await Story.getByUser(req.params.userId);
    res.json({ success: true, stories });
  } catch (err) {
    console.error('User stories error:', err);
    res.status(500).json({ error: 'Failed to load user stories' });
  }
}

async function createStory(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Media file required' });
    const mediaUrl = toPublicMediaPath(req.file);
    const mediaType = getMediaType(req.file.mimetype);
    const story = await Story.create({ userId: req.user.id, mediaUrl, mediaType });
    res.status(201).json({ success: true, story });
  } catch (err) {
    console.error('Create story error:', err);
    res.status(500).json({ error: 'Failed to create story' });
  }
}

async function deleteStory(req, res) {
  try {
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await Story.deleteById(req.params.storyId);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete story error:', err);
    res.status(500).json({ error: 'Failed to delete story' });
  }
}

async function replyToStory(req, res) {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Reply text required' });
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    // Persist reply to DB
    await prisma.storyReply.create({
      data: { storyId: req.params.storyId, userId: req.user.id, text: text.slice(0, 300) },
    });

    // Notify story owner
    if (story.userId !== req.user.id) {
      createNotification({
        recipientId: story.userId,
        senderId: req.user.id,
        type: 'story_reply',
        message: text.slice(0, 300),
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Story reply error:', err);
    res.status(500).json({ error: 'Failed to send reply' });
  }
}

async function addReaction(req, res) {
  try {
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: 'Reaction type required' });
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    await prisma.storyReaction.upsert({
      where: { storyId_userId: { storyId: req.params.storyId, userId: req.user.id } },
      update: { type },
      create: { storyId: req.params.storyId, userId: req.user.id, type },
    });

    if (story.userId !== req.user.id) {
      createNotification({
        recipientId: story.userId,
        senderId: req.user.id,
        type: 'story_reaction',
        message: `Reacted ${type} to your story`,
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Story reaction error:', err);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
}

async function getArchivedStories(req, res) {
  try {
    const userId = req.user.id;
    const stories = await prisma.story.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, stories });
  } catch (err) {
    console.error('Archived stories error:', err);
    res.status(500).json({ error: 'Failed to load archived stories' });
  }
}

module.exports = { 
  getStoryTray, 
  markStorySeen, 
  trackView, 
  getUserStories, 
  createStory, 
  deleteStory, 
  replyToStory, 
  addReaction,
  getArchivedStories 
};
