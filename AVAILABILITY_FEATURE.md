# 📅 Weekly Availability Feature - User Guide

## What It Does

The **Weekly Availability** feature solves a simple problem: **planning your pickleball week without endless group texts**.

### Before This Feature:
```
Sunday night group text:
You: "Anyone free Monday morning?"
[wait...]
Sarah: "What time?"
You: "7am?"
Sarah: "Can do 8am"
Mike: "I'm free Tuesday"
Tom: "What about Wednesday?"
[repeat for each day... finally play on Thursday maybe]
```

### With This Feature:
```
Sunday night:
1. Open "My Week" → Add your availability:
   - Monday 7-9am ✅
   - Wednesday 6-8pm ✅
   - Friday 7-9am ✅

2. System shows: "3 people match Monday 7am!"

3. Tap "View Matches" → Create Game → Done! ✅

No texting. No coordination. Just play.
```

---

## How to Use It

### Step 1: Post Your Availability

1. Open Pickle Chatter
2. Tap **"My Week" 📅** button on home screen
3. Tap **"+ Add Time Slot"**
4. Pick:
   - **Date**: When you're free (e.g., Monday Jan 20)
   - **Start Time**: 7:00 AM
   - **End Time**: 9:00 AM
   - **Location** (optional): "Riverside Courts"
   - **Notes** (optional): "Prefer doubles"
5. Tap **"Save"**

**Repeat for all the times you're free this week!**

### Step 2: See Who Matches

After adding your slots, you'll see:

```
┌─────────────────────────────────┐
│  Monday Jan 20                  │
│  🕐 7:00 AM - 9:00 AM          │
│  📍 Riverside Courts            │
│  [3 matches] [View Matches]     │
└─────────────────────────────────┘
```

Tap **"View Matches"** to see who else is available.

### Step 3: Create a Game

You'll see a list of players:

```
┌─────────────────────────────────┐
│  Sarah K. ⭐️⭐️⭐️⭐️          │
│  🕐 7:00 AM - 9:00 AM          │
│  📍 Riverside Courts            │
│  💬 "Looking for doubles!"      │
│  [Create Game] [Message]        │
└─────────────────────────────────┘
```

Tap **"Create Game"** and the app:
1. Creates a game session
2. Adds you and the other player
3. Sends them an invite
4. You both show up and play! 🎾

---

## Real-World Examples

### Example 1: The Morning Regular

**Tom plays every weekday morning before work:**

**Sunday night:**
- Opens "My Week"
- Adds M-F, 7-9am
- Sees he has 5-8 matches each day

**Result:**
- Monday: Plays with Sarah and Mike (3 people matched)
- Tuesday: Plays with Lisa (2 people matched)  
- Wednesday: Plays with John and Kim (4 people matched)
- Thursday: Plays with Sarah again
- Friday: Group game (8 people matched!)

**Zero texts sent. Five games played.**

### Example 2: The Weekend Warrior

**Lisa only plays weekends:**

**Friday afternoon:**
- Adds Sat 9-11am, Sat 2-4pm, Sun 10-12pm
- Sees 3 matches for Saturday morning

**Saturday morning:**
- Game already scheduled from Friday
- Shows up and plays
- Logs result
- Everyone happy

### Example 3: The Flexible Player

**Mike's schedule changes weekly:**

**This week he's free:**
- Tuesday 6pm
- Thursday 6pm  
- Saturday 9am

**Next week he's free:**
- Monday 7am
- Wednesday 7am
- Friday 7am

He just updates his availability each Sunday. The system handles the rest.

---

## Key Features

### ✅ Simple to Use
- Add slots in 10 seconds
- Visual week view
- Easy remove/edit

### ✅ Auto-Matching
- System finds overlapping times
- Only shows your group members
- Match count badges

### ✅ One-Tap Games
- Create game directly from match
- Both players get invited
- Location and time pre-filled

### ✅ Optional Details
- Add preferred location
- Add notes ("prefer singles", "beginners welcome")
- Others see your preferences

### ✅ Privacy & Security
- Only group members see your availability
- You control what you post
- Remove anytime

---

## Tips & Best Practices

### 📌 Post Early
- Post your availability Sunday for the whole week
- More matches = more games

### 📌 Be Specific
- "7:00 AM" not "morning"
- Include location if you have a preferred court
- Add notes if you have preferences

### 📌 Check Daily
- New matches appear as others post
- Check notifications for new matches

### 📌 Remove Past Slots
- System auto-expires past dates
- But you can manually remove if plans change

### 📌 Use Notes Effectively
```
Good notes:
- "Prefer doubles"
- "Beginners welcome"
- "Competitive play only"
- "Bring your A-game!"

Not helpful:
- "idk"
- "whatever"
- [blank]
```

---

## Technical Details

### Security
- ✅ Only your group members see your availability
- ✅ Cannot see availability of non-members
- ✅ All data encrypted in transit
- ✅ Row-level security policies enforced

### Performance
- ✅ Fast matching algorithm (< 100ms)
- ✅ Database indexes for speed
- ✅ Cached results

### Matching Logic
The system finds matches when:
1. Same date (Monday = Monday)
2. Overlapping times (your 7-9am overlaps their 8-10am)
3. Same group membership

**Examples:**
```
You:    7:00 AM - 9:00 AM  ✅ MATCH
Sarah:  8:00 AM - 10:00 AM

You:    7:00 AM - 9:00 AM  ❌ NO MATCH  
Mike:   9:00 AM - 11:00 AM (no overlap)

You:    7:00 AM - 9:00 AM  ❌ NO MATCH
Tom:    7:00 AM - 9:00 AM  (different group)
```

---

## FAQ

**Q: Can I post availability for next week?**
A: Yes! Post anytime within 7 days.

**Q: What if my plans change?**
A: Just remove the slot. Others won't see it anymore.

**Q: Do I have to create a game if someone matches?**
A: No, it's optional. You can just see who's available.

**Q: Can I message matched players?**
A: Not yet! Coming soon. For now, create a game to coordinate.

**Q: What if no one matches my times?**
A: Try different times, or post in your group to encourage others to use the feature.

**Q: Can I see who viewed my availability?**
A: No, it's private. Only match count is shown.

**Q: Do past slots get removed automatically?**
A: Yes! System auto-expires dates that have passed.

**Q: Can I set recurring availability (every Monday)?**
A: Not yet, but coming soon! For now, add each week manually.

**Q: Does this replace LFG posts?**
A: No! Use both:
  - **Availability**: Plan ahead ("I'm free all week mornings")
  - **LFG**: Last minute ("Need 1 more RIGHT NOW")

---

## Troubleshooting

**"I don't see any matches"**
- Others haven't posted availability yet
- Try different times
- Encourage your group to use the feature

**"I can't add availability"**
- Make sure you've joined a group first
- Check your permissions

**"Create Game button doesn't work"**
- Ensure you're in the same group as the matched player
- Check your internet connection

**"My availability disappeared"**
- Dates in the past auto-expire
- Someone may have removed you from the group

---

## What's Next?

Future enhancements coming soon:
- 🔔 Push notifications for new matches
- 🔁 Recurring availability ("every Monday 7am")
- 📊 Calendar view
- 💬 In-app messaging
- 🤖 Smart suggestions based on group patterns
- 🎯 "Best times" recommendation

---

## Share This Feature!

Love the availability feature? **Tell your group about it!**

The more people who use it, the more matches you'll get, the more you'll play.

**Get your whole group using it:**
1. Post your availability first
2. Share in group chat: "Just posted my week on Pickle Chatter!"
3. Others see your matches
4. They post their availability too
5. Everyone plays more 🎾

---

**Questions?** Contact support@picklechatter.com

**Feedback?** We'd love to hear how you're using this feature!

---

Built with ❤️ for pickleball players who want to spend more time playing and less time texting.
