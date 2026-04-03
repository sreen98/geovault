export const STATUS_TAGS = ["To Visit", "Visited", "Legendary", "Avoid"] as const;
export type StatusTag = (typeof STATUS_TAGS)[number];

export function isStatusTag(tag: string): tag is StatusTag {
  return (STATUS_TAGS as readonly string[]).includes(tag);
}
