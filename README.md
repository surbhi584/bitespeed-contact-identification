# Bitespeed Contact Identification Service

A Node.js web service that identifies and consolidates contact information to prevent duplicate entries and maintain data consistency. The service intelligently links contacts based on email addresses and phone numbers, establishing primary-secondary relationships between related contacts.

## 🚀 Live Endpoint

**Base URL:** https://bitespeed-contact-identification.onrender.com

**Identify Endpoint:** `https://bitespeed-contact-identification.onrender.com/identify`

## 📋 Overview

This service solves the common problem of duplicate contact entries by:

* Identifying existing contacts by email or phone number
* Creating primary-secondary relationships between related contacts
* Consolidating contact information across multiple entries
* Maintaining data integrity and preventing duplicate primaries

## 🛠 Tech Stack

* **Runtime:** Node.js with TypeScript
* **Framework:** Express.js
* **Database:** PostgreSQL with Prisma ORM
* **Hosting:** Render.com
* **Language:** TypeScript

## 🔗 API Endpoint

### POST `/identify`

Identifies and consolidates contact information based on email and/or phone number.

#### Request Body

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

**Note:** At least one of `email` or `phoneNumber` must be provided.

#### Response Format

```json
{
  "contact": {
    "primaryContactId": number,
    "emails": string[],
    "phoneNumbers": string[],
    "secondaryContactIds": number[]
  }
}
```

#### Example Requests & Responses

##### Example 1: New Contact Creation

**Request:**

```bash
curl -X POST https://bitespeed-contact-identification.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mcfly@hillvalley.edu",
    "phoneNumber": "123456"
  }'
```

**Response:**

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

##### Example 2: Linking Existing Contact

**Request:**

```bash
curl -X POST https://bitespeed-contact-identification.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mcfly@hillvalley.edu",
    "phoneNumber": "17756"
  }'
```

**Response:**

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456", "17756"],
    "secondaryContactIds": [23]
  }
}
```

##### Example 3: Consolidating Multiple Contacts

**Request:**

```bash
curl -X POST https://bitespeed-contact-identification.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "george@hillvalley.edu",
    "phoneNumber": "919191"
  }'
```

**Response:**

```json
{
  "contact": {
    "primaryContactId": 11,
    "emails": ["george@hillvalley.edu", "biffsucks@hillvalley.edu"],
    "phoneNumbers": ["919191"],
    "secondaryContactIds": [27]
  }
}
```

## 🔄 Service Logic

The service follows this workflow:

1. **Input Validation:** Ensures at least one contact method (email/phone) is provided
2. **Contact Matching:** Searches for existing contacts with matching email or phone number
3. **New Contact Creation:** If no matches found, creates a new PRIMARY contact
4. **Primary Contact Identification:**
   * If matches exist, identifies the primary contact in the group
   * Handles secondary contacts by finding their linked primary
5. **Primary Consolidation:**
   * If multiple primary contacts are found with same email/phone
   * Converts all but the oldest to secondary contacts
6. **Information Aggregation:**
   * Collects all emails and phone numbers from the contact group
   * Identifies all secondary contact IDs
7. **New Information Handling:**
   * If request contains new email/phone not in existing contacts
   * Creates a new secondary contact linked to the primary

## ⚙️ Key Features

* **Intelligent Contact Linking:** Automatically identifies related contacts
* **Primary-Secondary Hierarchy:** Maintains clear contact relationships
* **Data Consolidation:** Prevents duplicate primary contacts
* **Information Aggregation:** Provides comprehensive contact information
* **Flexible Input:** Accepts email, phone, or both

## 🚦 Error Handling

* **400 Bad Request:** When neither email nor phoneNumber is provided
* **500 Internal Server Error:** For database or server-related issues

## 🏃‍♂️ Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your database connection in `.env`
4. Run Prisma migrations: `npx prisma migrate dev`
5. Generate Prisma client: `npx prisma generate`
6. Start the server: `npm run dev`
