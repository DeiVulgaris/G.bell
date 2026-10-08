export type FilterCategory = 'ALL' | 'GROUPS' | 'ADVERT' | 'BUSINESS' | 'SOS';

export type ProfileCategory = Exclude<FilterCategory, 'ALL'>;

export interface WordTag {
  word: string;
  normalized: string;
  active: boolean;
}

export type ProPictogramType =
  | 'GOLD_BUST'
  | 'STAR'
  | 'CROWN'
  | 'LIGHTNING'
  | 'DIAMOND'
  | 'SHIELD';

export interface ActiveProfileItem {
  id: string;
  authorName: string;
  visibleName?: string;
  visibleNickname?: string;
  visibleIdentityLabel?: string;
  visibleDescription?: string;
  karmaPlus?: number;
  karmaMinus?: number;
  category?: ProfileCategory;
  userTier?: 'FREE' | 'PRO' | 'BUSINESS';
  proPictogram?: ProPictogramType;
  profileText: string;
  disabledWords?: string[];
  latOffset: number;
  lngOffset: number;
  position: {
    lat: number;
    lng: number;
  };
  updatedAt: string;
  contact?: string;
  advertStatus?: 'NATIVE' | 'GUEST';
  ownerProfileId?: string;
  slotId?: number;
}
