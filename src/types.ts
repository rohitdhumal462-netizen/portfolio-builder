/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Experience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description: string;
  order: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  link: string;
  demoLink?: string;
  imageURL: string;
  images?: string[];
  techStack?: string;
  order: number;
}

export interface SocialLink {
  id: string;
  platform: string; // GitHub, LinkedIn, Twitter, Website, etc.
  url: string;
  order: number;
}

export interface Portfolio {
  username: string;
  displayName: string;
  bio: string;
  photoURL: string;
  theme: string; // "light" | "dark" | "cyber" | "slate"
  sectionsOrder: string[]; // ["experiences", "projects", "socialLinks"]
  ownerId: string;
  cvUrl?: string; // Optional URL representing a printable CV/Resume document
  tagline?: string; // Optional tagline (e.g. "Data Scientist · ML Engineer")
  skills?: string; // Optional comma-separated list of overall candidate skills (e.g. "Python, Pandas, SQL")
  experiences: Experience[];
  projects: Project[];
  socialLinks: SocialLink[];
}

export interface AIResponse {
  result: string;
  error?: string;
}
