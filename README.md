# 🌎 Language Learning Platform

A feature-rich Duolingo-inspired language learning platform built with Next.js 14, featuring AI voices, gamification, and subscription-based learning.

![Next JS](https://img.shields.io/badge/Next.js%2014-black?style=flat&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![DrizzleORM](https://img.shields.io/badge/DrizzleORM-00C7B7?style=flat&logo=prisma&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=flat&logo=stripe&logoColor=white)

## ✨ Key Features

### 🎮 Core Learning Features
- **🔊 Interactive Learning**
  - AI-powered voices via Elevenlabs
  - Sound effects for engagement
  - Character animations by KenneyNL
  - Mobile responsive design

- **❤️ Hearts System**
  - Limited lives mechanics
  - Heart recovery through practice
  - Premium unlimited hearts
  - Practice mode for heart regeneration

- **🏆 Gamification**
  - Points/XP system
  - Leaderboard rankings
  - Quest milestones
  - Achievement tracking

### 🛍️ Economy System
- **Shop System**
  - Exchange points for hearts
  - Special items
  - Bonus features
  - Daily offers

### 💳 Premium Features
- **Pro Tier (Stripe)**
  - Unlimited hearts
  - Ad-free experience
  - Special characters
  - Bonus quests

### 👨‍💼 Administration
- **Admin Dashboard**
  - User management
  - Content management
  - Analytics
  - Moderation tools

## 🛠️ Tech Stack

```typescript
const techStack = {
  frontend: {
    framework: "Next.js 14",
    components: "Shadcn UI",
    styling: "TailwindCSS",
    admin: "React Admin"
  },
  backend: {
    database: "PostgreSQL (NeonDB)",
    orm: "DrizzleORM",
    auth: "Clerk",
    voice: "Elevenlabs AI"
  },
  infrastructure: {
    hosting: "Vercel",
    storage: "NeonDB",
    cdn: "Vercel Edge Network"
  }
};
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or NeonDB account)
- Clerk account
- Stripe account
- Elevenlabs AI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/language-learning-platform.git
cd language-learning-platform
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**
```bash
# .env.local
DATABASE_URL="postgres://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
ELEVENLABS_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

4. **Initialize the database**
```bash
pnpm db:push
```

5. **Start development server**
```bash
pnpm dev
```

## 💎 Core Features Implementation

### 🎯 Lesson System

```typescript
// Lesson progress tracking
export async function trackLessonProgress({
  userId,
  lessonId,
  score,
  heartsUsed
}: LessonProgress) {
  return await db.transaction(async (tx) => {
    // Update user XP
    await tx.update(users)
      .set({ 
        xp: sql`xp + ${score}`,
        hearts: sql`hearts - ${heartsUsed}`
      })
      .where(eq(users.id, userId));
    
    // Record lesson completion
    await tx.insert(lessonCompletions).values({
      userId,
      lessonId,
      score,
      heartsUsed,
      completedAt: new Date()
    });
  });
}
```

### 🔊 Audio System

```typescript
// AI Voice Generation
export async function generateVoiceOver(text: string, language: string) {
  const voice = await elevenlabs.generate({
    text,
    voice: getVoiceForLanguage(language),
    model: 'eleven_multilingual_v2'
  });

  return voice;
}

// Sound Effects Player
export const SoundEffect = {
  correct: new Audio('/sounds/correct.mp3'),
  wrong: new Audio('/sounds/wrong.mp3'),
  heartLost: new Audio('/sounds/heart-lost.mp3'),
  
  play: (effect: keyof typeof SoundEffect) => {
    SoundEffect[effect].currentTime = 0;
    SoundEffect[effect].play();
  }
};
```

### ❤️ Hearts System

```typescript
// Hearts Management
export const heartsSystem = {
  async useHeart(userId: string) {
    return await db.update(users)
      .set({ 
        hearts: sql`GREATEST(hearts - 1, 0)` 
      })
      .where(eq(users.id, userId))
      .returning({ hearts: users.hearts });
  },

  async regainHeart(userId: string) {
    return await db.update(users)
      .set({ 
        hearts: sql`LEAST(hearts + 1, 5)` 
      })
      .where(eq(users.id, userId))
      .returning({ hearts: users.hearts });
  },

  async buyHearts(userId: string, amount: number, cost: number) {
    return await db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (user.points < cost) {
        throw new Error('Insufficient points');
      }

      await tx.update(users)
        .set({ 
          hearts: sql`LEAST(hearts + ${amount}, 5)`,
          points: sql`points - ${cost}`
        })
        .where(eq(users.id, userId));
    });
  }
};
```

### 🏆 Leaderboard System

```typescript
// Leaderboard Management
export async function getLeaderboard(timeframe: 'daily' | 'weekly' | 'allTime') {
  const dateFilter = timeframe === 'daily' 
    ? sql`DATE(created_at) = CURRENT_DATE`
    : timeframe === 'weekly'
    ? sql`created_at >= CURRENT_DATE - INTERVAL '7 days'`
    : sql`1=1`;

  return await db.select({
    userId: users.id,
    username: users.username,
    xp: sql<number>`SUM(xp)`,
    rank: sql<number>`RANK() OVER (ORDER BY SUM(xp) DESC)`
  })
  .from(lessonCompletions)
  .innerJoin(users, eq(users.id, lessonCompletions.userId))
  .where(dateFilter)
  .groupBy(users.id)
  .orderBy(sql`SUM(xp) DESC`)
  .limit(100);
}
```

### 🎯 Quest System

```typescript
// Quest Progress Tracking
export async function updateQuestProgress(userId: string, action: QuestAction) {
  const activeQuests = await db.query.quests.findMany({
    where: and(
      eq(quests.userId, userId),
      eq(quests.completed, false),
      eq(quests.type, action.type)
    )
  });

  for (const quest of activeQuests) {
    const progress = await db.update(questProgress)
      .set({ 
        current: sql`LEAST(current + ${action.value}, ${quest.target})`
      })
      .where(eq(questProgress.questId, quest.id))
      .returning({ current: questProgress.current });

    if (progress.current >= quest.target) {
      await completeQuest(quest.id);
    }
  }
}
```

## 🔒 Security & Performance

### Rate Limiting

```typescript
export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'language-learning'
});
```

### Caching Strategy

```typescript
// Lesson content caching
export async function getLessonContent(lessonId: string) {
  const cached = await redis.get(`lesson:${lessonId}`);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    include: {
      exercises: true,
      vocabulary: true
    }
  });

  await redis.set(
    `lesson:${lessonId}`, 
    JSON.stringify(lesson), 
    'EX', 
    3600
  );

  return lesson;
}
```

## 📊 Analytics System

```typescript
// User Analytics
export async function getUserAnalytics(userId: string) {
  const stats = await db.select({
    totalXP: sql<number>`SUM(xp)`,
    lessonsCompleted: sql<number>`COUNT(*)`,
    averageScore: sql<number>`AVG(score)`,
    streakDays: sql<number>`COUNT(DISTINCT DATE(completed_at))`
  })
  .from(lessonCompletions)
  .where(eq(lessonCompletions.userId, userId));

  return stats;
}
```

## 🚀 Deployment

1. **Database Setup**
```bash
pnpm db:push
```

2. **Configure Vercel**
```bash
vercel env pull
```

3. **Deploy**
```bash
vercel deploy
```

## ⚡ Performance Optimizations

- Edge runtime support
- Asset optimization
- Route caching
- API response caching
- Image optimization

## 🔄 Updates & Maintenance

- Daily content updates
- Weekly leaderboard resets
- System maintenance
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Shadcn UI](https://ui.shadcn.com/)
- [DrizzleORM](https://orm.drizzle.team/)
- [Elevenlabs](https://elevenlabs.io/)
- [KenneyNL](https://kenney.nl/)
- [Clerk](https://clerk.dev/)
- [Stripe](https://stripe.com/)
- [React Admin](https://marmelab.com/react-admin/)

---

Built with 💚 by Awais Raza
