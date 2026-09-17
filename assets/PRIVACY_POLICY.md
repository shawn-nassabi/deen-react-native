# Privacy Policy

_Last updated April 14, 2026 — revised to reflect Supabase infrastructure, Anthropic/Claude AI provider, and updated account data collection._

## 1. Introduction

Deen ("we," "us," or "our") is an AI-powered Islamic education platform for Twelver Shia Muslims. This Privacy Policy explains what information we collect, how we use and protect it, which third-party services process it, and the choices available to you.

By using Deen you agree to the practices described in this policy. If you do not agree, please do not use the app.

---

## 2. Information We Collect

### 2.1 Account information

When you create an account we collect:

- **Email address** — used to identify your account and enable authentication.
- **Account role and status** — internal flags (e.g., whether the account is active).
- **Timestamps** — when your account was created and last updated.

We do not collect your name, display name, profile picture, or any other personal identifiers beyond your email address.

Authentication is managed by **Supabase Auth**, which issues and validates JSON Web Tokens (JWTs) for every session. Supabase processes your email and authentication credentials in accordance with [Supabase's privacy policy](https://supabase.com/privacy).

### 2.2 Conversation and chat history

When you use the AI chat assistant we collect and store:

- **Your messages** (the questions you type) and **the AI's responses**, labelled by role (user / assistant).
- **Chat session metadata** — a session title, session ID, and the timestamps of session creation and last message.

This data is stored in two places:

- **Short-term (Redis):** Your most recent conversation history (up to 30 messages) is kept in Redis with a rolling expiry of approximately 3.3 hours (12,000 seconds). This is used to give the AI context about your current conversation so you can ask natural follow-up questions.
- **Long-term (Supabase PostgreSQL):** Full conversation history is persisted in our Supabase-hosted PostgreSQL database and linked to your account. It is retained until you delete it or request account deletion.

### 2.3 Learning progress

We track your progress through lessons and content, including:

- Which lessons and content pages you have completed or partially completed.
- Percentage of completion and your last reading position within a piece of content.
- Any notes you write directly within a lesson.

This data is stored in our Supabase-hosted database and used to resume your progress across devices and sessions.

### 2.4 AI-inferred memory profile

As you interact with Deen, our AI builds and maintains a **personal learning profile** to personalise your experience. This profile is stored in our database and includes AI-generated notes across five categories:

- **Learning notes** — insights about how you learn and what topics you are working on.
- **Interest notes** — subjects and themes you have expressed interest in.
- **Knowledge notes** — what the AI has inferred about your existing knowledge and gaps.
- **Behavior notes** — observed patterns in how you engage with content.
- **Preference notes** — your preferred language, style, and other stated preferences.

Each of these categories is stored as a list of structured notes generated entirely by the AI based on your chat interactions and lesson activity. The profile is stored in our Supabase-hosted database, updated over time, and used to personalise AI responses and lesson introductions. A record of each update event (the trigger, the raw context, and the AI's reasoning) is also retained as a **memory event** log.

### 2.5 Personalized lesson primers

For each lesson you access, the AI generates a short, personalized introduction (a "primer") based on your memory profile. This generated content is cached in our database and associated with your account and the relevant lesson.

### 2.6 Note embeddings

To enable semantic search — for example, to match your learning interests to relevant lessons — we compute and store **vector embeddings** (numerical representations) of notes in your memory profile. These embeddings are produced by a locally-running open-source model (`all-mpnet-base-v2` from HuggingFace / sentence-transformers) and stored in our database. They do not leave our servers.

---

## 3. How We Collect Data

### 3.1 Data you provide directly

Account information is collected when you register or update your profile. Notes written within lessons are collected when you save them.

### 3.2 Data generated automatically through your use of the app

Conversation messages, session metadata, learning progress, and updates to your memory profile are collected automatically as you use the app. You do not need to take a separate action — using the chat or navigating lessons is sufficient to generate this data.

### 3.3 Data sent for AI processing

Every time you send a message to the AI chat assistant, the following data is transmitted to our backend server and then forwarded to **Anthropic** (the maker of Claude) for processing:

- Your current message.
- Recent conversation history (up to the last 30 messages from Redis).
- Your AI memory profile (the notes described in Section 2.4), where relevant to the request.
- Retrieved passages from our Islamic knowledge base (hadith, Quranic tafsir, Ayatollah Sistani's published rulings) — this is reference text, not your personal data, but it is included in the prompt sent to the AI.

This data is transmitted only when you actively interact with the AI. It is not collected passively in the background.

---

## 4. Third-Party Service Providers and AI Processing

We use the following third-party services to operate Deen. Each is described below with the specific data it processes and the purpose for which it is used.

### 4.1 Anthropic (AI model provider)

**What:** Anthropic provides the Claude large language models that power Deen's AI chat assistant, memory system, and all AI-driven features.

**Which models:**
- **Claude Sonnet 4.6** (`claude-sonnet-4-6`) — used for primary response generation, query classification, fiqh reasoning and evidence evaluation, language translation, memory profile updates, personalized primer generation, and memory consolidation.
- **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — used for lightweight tasks such as query enhancement (rewriting your question to improve search accuracy) and primer generation where speed is prioritised.

**What data is sent to Anthropic:**

| Task | Model used | Data sent |
|---|---|---|
| Answering a question | Claude Sonnet 4.6 | Your message, conversation history, memory profile notes, retrieved Islamic source passages |
| Fiqh evidence evaluation and answer synthesis | Claude Sonnet 4.6 | Your message, retrieved Sistani ruling passages, conversation history |
| Query classification (Islamic vs. non-Islamic, fiqh vs. general) | Claude Sonnet 4.6 | Your message |
| Language detection and translation | Claude Sonnet 4.6 | Your message or the AI's response text |
| Query enhancement | Claude Haiku 4.5 | Your message, conversation history |
| Memory profile update | Claude Sonnet 4.6 | A summary of the conversation turn, your existing memory profile |
| Personalized primer generation | Claude Haiku 4.5 | Lesson content, your memory profile notes |
| Memory consolidation | Claude Sonnet 4.6 | Your existing memory profile notes |

**How:** Data is transmitted over TLS to Anthropic's API. Anthropic's API usage policies govern how API-submitted data is handled. Refer to [Anthropic's privacy policy](https://www.anthropic.com/legal/privacy) for full details.

**Why:** The AI features are the core of Deen. Without sending your query and profile context to the model, personalised and contextually relevant responses cannot be generated.

We require Anthropic, as a service provider processing data on our behalf, to provide the same or equivalent protection of user data as described in this Privacy Policy.

### 4.2 Supabase (authentication and database)

**What:** Supabase provides two distinct services that are central to Deen:

- **Supabase Auth** — manages account sign-up, sign-in, and session management. It issues and validates the JSON Web Tokens (JWTs) that authorize your requests to our API. Your email address and authentication credentials are processed by Supabase Auth.
- **Supabase-hosted PostgreSQL** — our primary database runs on Supabase's managed PostgreSQL infrastructure. All persistent user data described in Section 2 (conversation history, learning progress, memory profile, primers, note embeddings) is stored here.

**Why:** Supabase provides a unified, secure platform for both authentication and database hosting, reducing the number of third parties that handle your data.

Refer to [Supabase's privacy policy](https://supabase.com/privacy) for details on how Supabase handles data stored on its infrastructure.

### 4.3 Pinecone (vector search — knowledge base only)

**What:** Pinecone hosts our Islamic knowledge base as a vector index (hadith, Quranic tafsir, Ayatollah Sistani's rulings). When you ask a question, a search query — derived from your message — is sent to Pinecone to retrieve relevant source passages.

**What data is sent:** An embedding (a numerical vector) of your query or an enhanced version of it. Your personal information, account data, and conversation history are **not** sent to Pinecone. The passages returned are source texts from our knowledge base, not your data.

**Why:** Fast and accurate retrieval of relevant Islamic source texts to ground AI responses in verified scholarship.

### 4.4 Redis (session memory — our infrastructure)

**What:** Redis is used to store your short-term conversation history (up to 30 messages, ~3.3-hour TTL) during active sessions. This is part of our own infrastructure — it is not a third-party data processor in the consumer sense.

**Why:** Provides the AI with recent conversation context so you can ask natural follow-up questions without the AI losing track of the thread.

---

## 5. How We Use Your Information

| Data | Purpose |
|---|---|
| Account information | Account management, authentication, personalisation |
| Conversation history | Providing context to the AI, displaying your chat history in-app |
| Learning progress | Resuming where you left off, displaying progress indicators |
| Memory profile | Personalising AI responses and lesson primers |
| Memory events | Audit log of profile updates; used to improve consolidation |
| Personalized primers | Displaying tailored lesson introductions |
| Note embeddings | Matching your interests to relevant lessons (semantic search) |

We do not use your data for advertising. We do not sell, rent, or trade your personal information to third parties.

---

## 6. How We Share Your Information

- We do not sell, rent, or trade your personal information.
- Your conversation messages, memory profile, and related context are shared with **Anthropic** only when you actively use the AI chat assistant, as described in Section 4.1. We share only the data necessary to fulfill the requested AI feature.
- Your email and authentication credentials are processed by **Supabase Auth** for account management and authentication, and all persistent data is stored on **Supabase's** PostgreSQL infrastructure, as described in Section 4.2.
- An embedding of your search query (not your personal data) is sent to **Pinecone** for knowledge base retrieval, as described in Section 4.3.
- We may disclose information if required by applicable law, regulation, or a valid legal process. Where permitted, we will attempt to notify you before complying.
- We require all service providers that process user data on our behalf to protect it in accordance with this Privacy Policy or to provide equivalent or greater protections.

---

## 7. Data Storage and Retention

| Data | Storage location | Retention |
|---|---|---|
| Account information | Supabase Auth + Supabase PostgreSQL | Until account deletion |
| Conversation history | Supabase PostgreSQL (long-term) + Redis (short-term, ~3.3h TTL) | Until you delete it or request account deletion |
| Learning progress | Supabase PostgreSQL | Until account deletion |
| Memory profile and events | Supabase PostgreSQL | Until account deletion |
| Personalized primers | Supabase PostgreSQL | Until account deletion or lesson deletion |
| Note embeddings | Supabase PostgreSQL | Until account deletion |

When you delete your account, we remove all records associated with your user ID from our database, including chat sessions and messages, learning progress, your memory profile and events, personalized primers, and note embeddings. Redis session data expires automatically within ~3.3 hours.

---

## 8. Your Choices

### Data access

You can view your conversation history and learning progress directly within the app.

### Account and data deletion

You can request full deletion of your account and all associated data through the account settings in the app. Upon deletion, your data is removed from our database as described in Section 7.

### AI memory profile

The AI memory profile is built automatically to improve your experience. If you wish to understand what is stored or request its deletion, contact us using the details in Section 11.

---

## 9. Security

We use industry-standard measures to protect your data:

- **Encryption in transit:** All data transmitted between the app, our servers, and third-party providers is encrypted using TLS.
- **Encryption at rest:** Data stored in our Supabase-hosted PostgreSQL database and Redis instances is protected using encryption at rest provided by the underlying cloud infrastructure.
- **Authentication:** Access to our API is gated by JWTs issued and validated by Supabase Auth. Passwords are never stored in plain text by us — credential management is handled entirely by Supabase.

No method of electronic storage or transmission is completely secure. We take reasonable and appropriate steps to safeguard your information, but we cannot guarantee absolute security.

---

## 10. Sensitive Content

Deen handles questions of Islamic jurisprudence (fiqh) and religious practice. We recognize that questions about religious belief and practice may be sensitive. We do not use this content for purposes other than providing you with the requested AI responses, and we do not profile users based on their religious questions beyond what is described in Sections 2.4 and 4.1 (AI memory and Anthropic processing).

The AI is designed to refuse to speculate or issue religious rulings (fatwas) of its own. All answers are grounded in retrieved source texts.

---

## 11. Children's Privacy

Deen is not directed at children under 13 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so we can take appropriate action.

---

## 12. Changes to This Policy

We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this document. We encourage you to review this policy periodically. Your continued use of Deen after changes are posted constitutes acceptance of the updated policy.

---

## 13. Contact

If you have questions about this Privacy Policy, wish to make a data-related request, or want to understand what data we hold about you, please contact us through the App Support link or email address provided in the app store listing.
