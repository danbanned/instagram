const prisma = require('../config/prisma');

/**
 * @desc    Get highlights for a specific user
 * @route   GET /api/highlights/:userId
 * @access  Public
 */
async function getHighlights(req, res) {
  try {
    const { userId } = req.params;
    
    const highlights = await prisma.highlight.findMany({
      where: { userId },
      include: {
        stories: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      highlights
    });
  } catch (error) {
    console.error('Get highlights error:', error);
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
}

/**
 * @desc    Create a new highlight
 * @route   POST /api/highlights
 * @access  Private
 */
async function createHighlight(req, res) {
  try {
    const userId = req.user.id;
    const { name, coverUrl, storyIds } = req.body;

    if (!name || !storyIds || !storyIds.length) {
      return res.status(400).json({ error: 'Name and at least one story are required' });
    }

    // Create the highlight and connect the stories
    const highlight = await prisma.highlight.create({
      data: {
        userId,
        name,
        coverUrl: coverUrl || '',
        stories: {
          connect: storyIds.map(id => ({ id }))
        }
      },
      include: {
        stories: true
      }
    });

    res.status(201).json({
      success: true,
      highlight
    });
  } catch (error) {
    console.error('Create highlight error:', error);
    res.status(500).json({ error: 'Failed to create highlight' });
  }
}

/**
 * @desc    Update a highlight
 * @route   PUT /api/highlights/:id
 * @access  Private
 */
async function updateHighlight(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, coverUrl, storyIds } = req.body;

    // Check ownership
    const existingHighlight = await prisma.highlight.findUnique({
      where: { id }
    });

    if (!existingHighlight) {
      return res.status(404).json({ error: 'Highlight not found' });
    }

    if (existingHighlight.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    
    if (storyIds) {
      // First disconnect all existing stories
      await prisma.highlight.update({
        where: { id },
        data: {
          stories: {
            set: [] // Disconnect all
          }
        }
      });
      
      // Then connect the new ones
      updateData.stories = {
        connect: storyIds.map(id => ({ id }))
      };
    }

    const highlight = await prisma.highlight.update({
      where: { id },
      data: updateData,
      include: {
        stories: true
      }
    });

    res.json({
      success: true,
      highlight
    });
  } catch (error) {
    console.error('Update highlight error:', error);
    res.status(500).json({ error: 'Failed to update highlight' });
  }
}

/**
 * @desc    Delete a highlight
 * @route   DELETE /api/highlights/:id
 * @access  Private
 */
async function deleteHighlight(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check ownership
    const highlight = await prisma.highlight.findUnique({
      where: { id }
    });

    if (!highlight) {
      return res.status(404).json({ error: 'Highlight not found' });
    }

    if (highlight.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.highlight.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Highlight deleted successfully'
    });
  } catch (error) {
    console.error('Delete highlight error:', error);
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
}

/**
 * @desc    Get stories for a highlight
 * @route   GET /api/highlights/:id/stories
 * @access  Public
 */
async function getHighlightStories(req, res) {
  try {
    const { id } = req.params;
    
    const highlight = await prisma.highlight.findUnique({
      where: { id },
      include: {
        stories: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!highlight) {
      return res.status(404).json({ error: 'Highlight not found' });
    }

    res.json({
      success: true,
      stories: highlight.stories
    });
  } catch (error) {
    console.error('Get highlight stories error:', error);
    res.status(500).json({ error: 'Failed to fetch highlight stories' });
  }
}

module.exports = {
  getHighlights,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  getHighlightStories
};
