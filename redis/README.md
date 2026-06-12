# Redis Phase 1 (Advanced Hinglish)

---

# Part 1: Redis Installation

Redis ek **in-memory key-value database** hai.

Matlab:

```text
key -> value
```

Example:

```text
name -> Mayank
age -> 20
city -> Jaipur
```

Traditional DB:

```text
Disk
↓
Read data
↓
Response
```

Redis:

```text
RAM
↓
Response
```

RAM disk se bahut fast hoti hai.

Approx:

| Storage     | Speed                    |
| ----------- | ------------------------ |
| HDD         | milliseconds             |
| SSD         | microseconds             |
| RAM (Redis) | nanoseconds/microseconds |

Isi wajah se Redis ko cache layer ke roop me use kiya jata hai.

---

# Installing Redis Using Docker (Production Style)

Real startups generally Docker use karti hain.

```bash
docker run -d \
--name redis-server \
-p 6379:6379 \
redis
```

Check:

```bash
docker ps
```

Enter Redis CLI:

```bash
docker exec -it redis-server redis-cli
```

Now:

```bash
PING
```

Output:

```text
PONG
```

Means Redis alive hai.

---

# Redis Architecture

Suppose:

```text
Express API
      ↓
Redis
      ↓
PostgreSQL
```

Redis:

* Temporary data
* Cache
* OTP
* Session
* Rate limiting

PostgreSQL:

* Permanent data

---

# Redis Stores Everything as Key-Value

Example:

```text
user:1:name → Mayank
user:1:email → abc@gmail.com
```

Structure:

```text
KEY → VALUE
```

Example:

```text
course → Redis Mastery
```

---

# Key Naming Convention (Very Important)

Bad:

```text
1
2
abc
```

Good:

```text
user:1
user:2

otp:abc@gmail.com

product:123

session:xyz

cart:user:5
```

Production me ye bahut important hai.

Suppose:

```text
cart:user:15
```

Tum instantly samajh jaoge:

* cart data hai
* user id = 15

---

# SET Command

Sabse basic command.

Syntax:

```bash
SET key value
```

Example:

```bash
SET name Mayank
```

Redis:

```text
name → Mayank
```

Response:

```text
OK
```

---

### GET

Retrieve value.

```bash
GET name
```

Output:

```text
"Mayank"
```

---

Visualization:

```text
SET name Mayank

Memory:

name
 ↓
Mayank

GET name

Output:
Mayank
```

---

# Updating Existing Value

```bash
SET name Rahul
```

Old:

```text
name → Mayank
```

New:

```text
name → Rahul
```

Redis overwrite kar deta hai.

---

# GET on Non-existing Key

```bash
GET age
```

Output:

```text
(nil)
```

Matlab key exist hi nahi karti.

---

# Multiple Examples

### Store email

```bash
SET email mayank@gmail.com
```

Retrieve:

```bash
GET email
```

---

Store city:

```bash
SET city Jaipur
```

Retrieve:

```bash
GET city
```

---

# DEL Command

Delete key.

Suppose:

```text
name → Mayank
```

Delete:

```bash
DEL name
```

Output:

```text
(integer) 1
```

Means:

1 key deleted.

Now:

```bash
GET name
```

Output:

```text
(nil)
```

---

## Why DEL is Important?

Imagine cache:

```text
product:123
```

Database:

```text
Price = ₹600
```

Redis:

```text
Price = ₹500
```

User updates product.

After DB update:

```js
await Product.update(...)

await redis.del("product:123")
```

Next request:

```text
Cache miss
↓
DB hit
↓
Fresh cache
```

This is called:

# Cache Invalidation

One of the hardest problems in software engineering.

---

# EXPIRE Command

Suppose:

```bash
SET otp 456789
```

Normally ye forever rahega.

Lekin OTP temporary hota hai.

```bash
EXPIRE otp 300
```

Means:

```text
5 minutes baad automatically delete
```

Memory:

```text
otp → 456789

TTL = 300 sec
```

After 5 min:

```text
otp deleted automatically
```

---

Example:

```bash
SET loginToken xyz123
EXPIRE loginToken 60
```

1 minute baad:

```text
deleted automatically
```

---

# Better Way (SET + EX)

Instead of:

```bash
SET otp 456789
EXPIRE otp 300
```

Do:

```bash
SET otp 456789 EX 300
```

Single command.

Production me isi ko prefer karte hain.

---

Example:

```bash
SET session abc123 EX 3600
```

Means:

```text
1 hour expiry
```

---

# TTL Command

TTL = Time To Live

Check remaining life.

Suppose:

```bash
SET otp 123456 EX 300
```

Now:

```bash
TTL otp
```

Output:

```text
280
```

Means:

280 seconds remaining.

---

After some time:

```bash
TTL otp
```

Output:

```text
150
```

Countdown chal raha hai.

---

After expiry:

```bash
TTL otp
```

Output:

```text
-2
```

Meaning:

Key doesn't exist.

---

If no expiry set:

```bash
SET name Mayank
TTL name
```

Output:

```text
-1
```

Meaning:

No expiration.

Forever stored.

---

# Internal Redis Working

Suppose:

```bash
SET otp 123456 EX 300
```

Internally Redis stores:

```text
Key:
otp

Value:
123456

Expire Timestamp:
current_time + 300
```

Redis continuously background me check karta hai:

```text
Expired?
↓
Delete
```

Ye process automatic hota hai.

---

# Practical OTP System

Store OTP:

```js
await redis.set(
    `otp:${email}`,
    otp,
    {
        EX: 300
    }
);
```

Example:

```text
otp:abc@gmail.com
```

Value:

```text
456789
```

---

Verify:

```js
const storedOtp =
await redis.get(`otp:${email}`);
```

Success:

```js
await redis.del(`otp:${email}`);
```

---

Benefits:

### No database table

Bad:

```sql
otp_table
```

Problems:

* unnecessary writes
* cleanup required
* scaling issues

Redis solves all this.

---

# Session Example

Login:

```js
await redis.set(
   `session:${sessionId}`,
   JSON.stringify(user),
   {
      EX: 86400
   }
);
```

24 hours later:

Automatically deleted.

---

# Password Reset Link

```js
await redis.set(
   `reset:${token}`,
   userId,
   {
      EX: 900
   }
);
```

15 minutes later:

Deleted automatically.

---

# Email Verification

```js
verify:user:15
```

TTL:

```text
10 minutes
```

---

# Common Startup Expiry Times

### OTP

```text
5 minutes
```

---

### Email Verification

```text
10 minutes
```

---

### Session

```text
24 hours
```

---

### JWT Blacklist

```text
JWT remaining expiry
```

---

### API Cache

```text
5–30 minutes
```

---

### Trending Products Cache

```text
1 hour
```

---

# Redis Memory Example

Imagine:

```text
product:1
product:2
product:3
otp:user1
otp:user2
session:abc
session:def
```

Redis RAM me sab data hold karta hai.

Agar key expire ho gayi:

```text
otp:user1
```

Automatically remove.

Memory free.

---

# Node.js Example (ioredis)

Install:

```bash
npm install ioredis
```

Connection:

```js
import Redis from "ioredis";

const redis = new Redis();
```

SET:

```js
await redis.set("name", "Mayank");
```

GET:

```js
const value = await redis.get("name");
```

DEL:

```js
await redis.del("name");
```

SET with expiry:

```js
await redis.set(
    "otp",
    "123456",
    "EX",
    300
);
```

TTL:

```js
await redis.ttl("otp");
```

---

# Real Production Folder

```text
src
|
├── config
│     redis.js
│
├── services
│     otp.service.js
│
├── controllers
│     auth.controller.js
```

redis.js

```js
import Redis from "ioredis";

export const redis = new Redis(
    process.env.REDIS_URL
);
```

Then use everywhere:

```js
import { redis } from "../config/redis.js";
```

---

# Interview Questions

### Why Redis faster than PostgreSQL?

Because Redis stores data in RAM.

---

### Difference between EXPIRE and TTL?

EXPIRE sets lifetime.

TTL checks remaining lifetime.

---

### TTL returns -1 means?

No expiry set.

---

### TTL returns -2 means?

Key doesn't exist.

---

### Why OTP should not be stored in database?

Because OTP is temporary data.

Redis automatically removes it.

---

### Why use namespaced keys?

For maintainability and easier debugging.

---

# Phase 1 Mastery Checklist

### Installation

✅ Docker Redis

### Commands

✅ SET

✅ GET

✅ DEL

✅ EXPIRE

✅ TTL

### Concepts

✅ Key naming

✅ Expiration

✅ Temporary storage

✅ OTP system

✅ Session storage

✅ Cache invalidation

---

After mastering this Phase 1, next phase should be:

> **Redis Data Structures (Strings, Lists, Hashes, Sets, Sorted Sets)**

Ye phase Redis ko "simple cache" se "powerful data engine" me convert karta hai, aur wahi cheez startups heavily use karte hain.
