export const VOTE_CHOICES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'NONE'] as const;
export type VoteChoice = (typeof VOTE_CHOICES)[number];

export const NONE_CHOICE: VoteChoice = 'NONE';
