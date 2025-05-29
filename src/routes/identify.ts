import express from "express";
import { prisma } from "../db";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: "Either email or phoneNumber is required" });
  }

  // Find any contact matching email or phone (primary or secondary)
  const matchingContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { email },
        { phoneNumber }
      ],
    },
  });

  if (matchingContacts.length === 0) {
    // No contacts found, create new primary
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "PRIMARY",
        deletedAt: null,
      },
    });

    return res.json({
      contact: {
        primaryContactId: newContact.id,
        emails: [email],
        phoneNumbers: [phoneNumber],
        secondaryContactIds: [],
      },
    });
  }

  // Step 1: Find primary contact for the linked group
  // If any matching contact is secondary, find its primary via linkedId
  // Else pick the oldest primary among matching
  let primaryContact: any = null;

  // Find primary contacts among matches
  const primaryMatches = matchingContacts.filter(c => c.linkPrecedence === "PRIMARY");

  if (primaryMatches.length > 0) {
    // Pick oldest primary by createdAt
    // primaryContact = primaryMatches.reduce((oldest, curr) => {
    primaryContact = primaryMatches.reduce((oldest: any, curr) => {
      if (!oldest) return curr;
      return curr.createdAt < oldest.createdAt ? curr : oldest;
    }, null as any);
  } else {
    // No primary in matches, so find primary of the first secondary contact
    const secondaryContact = matchingContacts[0];
    if (secondaryContact.linkedId) {
      primaryContact = await prisma.contact.findUnique({
        where: { id: secondaryContact.linkedId },
      });
    } else {
      // Fallback: treat this contact as primary if no linkedId
      primaryContact = secondaryContact;
    }
  }

  // Step 2: Reconcile multiple primaries if any
  // Find all primary contacts with same email or phone and pick oldest as primaryContact
  const allPrimaries = await prisma.contact.findMany({
    where: {
      linkPrecedence: "PRIMARY",
      OR: [
        { email },
        { phoneNumber }
      ],
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (allPrimaries.length > 1) {
    // Convert all but oldest primary to secondary
    const oldestPrimary = allPrimaries[0];
    await Promise.all(
      allPrimaries.slice(1).map(async (p) => {
        await prisma.contact.update({
          where: { id: p.id },
          data: {
            linkPrecedence: "SECONDARY",
            linkedId: oldestPrimary.id,
          },
        });
      })
    );
    primaryContact = oldestPrimary;
  }

  // Step 3: Get all contacts linked to this primary (including primary itself)
  const linkedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryContact.id },
        { linkedId: primaryContact.id },
      ],
    },
  });

  // Step 4: Collect emails, phones, and secondary IDs
  const emails = new Set<string>();
  const phoneNumbers = new Set<string>();
  const secondaryContactIds: number[] = [];

  linkedContacts.forEach(c => {
    if (c.email) emails.add(c.email);
    if (c.phoneNumber) phoneNumbers.add(c.phoneNumber);
    if (c.linkPrecedence === "SECONDARY") secondaryContactIds.push(c.id);
  });

  // Step 5: Check if new info is provided in request that's missing in contacts
  const newEmail = email && !emails.has(email);
  const newPhone = phoneNumber && !phoneNumbers.has(phoneNumber);

  if (newEmail || newPhone) {
    const newSecondary = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: primaryContact.id,
        linkPrecedence: "SECONDARY",
        deletedAt: null,
      },
    });
    secondaryContactIds.push(newSecondary.id);
    if (email) emails.add(email);
    if (phoneNumber) phoneNumbers.add(phoneNumber);
  }

  res.json({
    contact: {
      primaryContactId: primaryContact.id,
      emails: Array.from(emails),
      phoneNumbers: Array.from(phoneNumbers),
      secondaryContactIds,
    },
  });
});

export default router;
