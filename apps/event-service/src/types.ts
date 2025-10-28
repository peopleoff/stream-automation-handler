/**
 * Event Service Types
 * Shared types for TikTok event processing and automation execution
 */

// ============================================================================
// TikTok Event Types
// ============================================================================

export type TikTokEventType = "gift" | "comment" | "like" | "follow" | "share";

export interface TikTokGiftEvent {
  type: "gift";
  giftId: string;
  giftName: string;
  giftValue: number;
  repeatCount: number;
  username: string;
  userId: string;
  timestamp: number;
  final: boolean;
}

export interface TikTokCommentEvent {
  type: "comment";
  comment: string;
  username: string;
  userId: string;
  timestamp: number;
}

export interface TikTokLikeEvent {
  type: "like";
  likeCount: number;
  totalLikes: number;
  username: string;
  userId: string;
  timestamp: number;
}

export interface TikTokSocialEvent {
  type: "follow" | "share";
  username: string;
  userId: string;
  timestamp: number;
}

export type TikTokEvent =
  | TikTokGiftEvent
  | TikTokCommentEvent
  | TikTokLikeEvent
  | TikTokSocialEvent;

// ============================================================================
// Raw TikTok API Types (from tiktok-live-connector)
// ============================================================================

export interface TikTokRawImage {
  url: string[];
  mUri: string;
  height: number;
  width: number;
  avgColor: string;
  imageType: number;
  schema: string;
  content?: any;
  isAnimated: boolean;
}

export interface TikTokRawFollowInfo {
  followingCount: string;
  followerCount: string;
  followStatus: string;
  pushStatus: string;
}

export interface TikTokRawUserHonor {
  totalDiamond: string;
  diamondIcon?: TikTokRawImage;
  currentHonorName: string;
  currentHonorIcon?: TikTokRawImage;
  nextHonorName: string;
  level: number;
  nextHonorIcon?: TikTokRawImage;
  currentDiamond: string;
  thisGradeMinDiamond: string;
  thisGradeMaxDiamond: string;
  gradeDescribe: string;
  gradeIconList: any[];
  screenChatType: string;
  imIcon?: TikTokRawImage;
  imIconWithLevel?: TikTokRawImage;
  liveIcon?: TikTokRawImage;
  newImIconWithLevel?: TikTokRawImage;
  newLiveIcon?: TikTokRawImage;
  upgradeNeedConsume: string;
  nextPrivileges: string;
  profileDialogBg?: TikTokRawImage;
  profileDialogBackBg?: TikTokRawImage;
  score: string;
  gradeBanner: string;
}

export interface TikTokRawUserAttr {
  isMuted: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  muteDuration: string;
}

export interface TikTokRawBadge {
  [key: string]: any;
}

export interface TikTokRawUser {
  userId: string;
  nickname: string;
  bioDescription: string;
  profilePicture: TikTokRawImage;
  profilePictureMedium?: TikTokRawImage;
  profilePictureLarge?: TikTokRawImage;
  verified: boolean;
  status: number;
  createTime: string;
  modifyTime: string;
  secret: number;
  shareQrcodeUri: string;
  badgeImageList: any[];
  followInfo: TikTokRawFollowInfo;
  userHonor: TikTokRawUserHonor;
  fansClub?: any;
  border?: any;
  specialId: string;
  avatarBorder?: any;
  medal?: any;
  userBadges: any[];
  newUserBadges: any[];
  topVipNo: number;
  userAttr: TikTokRawUserAttr;
  ownRoom?: any;
  payScore: string;
  fanTicketCount: string;
  anchorInfo?: any;
  linkMicStats: number;
  uniqueId: string;
  enableShowCommerceSale: boolean;
  withFusionShopEntry: boolean;
  payScores: string;
  anchorLevel?: any;
  verifiedContent: string;
  authorInfo?: any;
  topFans: any[];
  secUid: string;
  userRole: number;
  rewardInfo?: any;
  personalCard?: any;
  authenticationInfo?: any;
  mediaBadgeImageList: any[];
  commerceWebcastConfigIds: any[];
  borders: any[];
  comboBadgeInfo?: any;
  subscribeInfo?: any;
  badges: TikTokRawBadge[];
  mintTypeLabel: any[];
  fansClubInfo?: any;
  allowFindByContacts: boolean;
  allowOthersDownloadVideo: boolean;
  allowOthersDownloadWhenSharingVideo: boolean;
  allowShareShowProfile: boolean;
  allowShowInGossip: boolean;
  allowShowMyAction: boolean;
  allowStrangeComment: boolean;
  allowUnfollowerComment: boolean;
  allowUseLinkmic: boolean;
  avatarJpg?: TikTokRawImage;
  backgroundImgUrl: string;
  blockStatus: number;
  commentRestrict: number;
  constellation: string;
  disableIchat: number;
  enableIchatImg: string;
  exp: number;
  foldStrangerChat: boolean;
  followStatus: string;
  ichatRestrictType: number;
  idStr: string;
  isFollower: boolean;
  isFollowing: boolean;
  needProfileGuide: boolean;
  pushCommentStatus: boolean;
  pushDigg: boolean;
  pushFollow: boolean;
  pushFriendAction: boolean;
  pushIchat: boolean;
  pushStatus: boolean;
  pushVideoPost: boolean;
  pushVideoRecommend: boolean;
  verifiedReason: string;
  enableCarManagementPermission: boolean;
  upcomingEventList: any[];
  scmLabel: string;
  ecommerceEntrance?: any;
  isBlock: boolean;
  isSubscribe: boolean;
  isAnchorMarked: boolean;
}

export interface TikTokRawDisplayText {
  displayType: string;
  defaultPattern: string;
  defaultFormat?: any;
  piecesList: any[];
}

export interface TikTokRawCommon {
  method: string;
  msgId: string;
  roomId: string;
  createTime: string;
  monitor: number;
  isShowMsg: boolean;
  describe: string;
  displayText: TikTokRawDisplayText;
  foldType: string;
  anchorFoldType: string;
  priorityScore: string;
  logId: string;
  msgProcessFilterK: string;
  msgProcessFilterV: string;
  fromIdc: string;
  toIdc: string;
  filterMsgTagsList: any[];
  sei?: any;
  dependRootId?: any;
  dependId?: any;
  anchorPriorityScore: string;
  roomMessageHeatLevel: string;
  foldTypeForWeb: string;
  anchorFoldTypeForWeb: string;
  clientSendTime: string;
  dispatchStrategy: number;
}

export interface TikTokRawGiftDetails {
  giftImage: TikTokRawImage;
  describe: string;
  duration: number;
  id: string;
  forLinkMic: boolean;
  combo: boolean;
  giftType: number;
  diamondCount: number;
  isDisplayedOnPanel: boolean;
  primaryEffectId: string;
  giftLabelIcon?: TikTokRawImage;
  giftName: string;
  icon: TikTokRawImage;
  goldEffect: string;
  previewImage?: TikTokRawImage;
  giftPanelBanner?: TikTokRawImage;
  isBroadcastGift: boolean;
  isEffectBefview: boolean;
  isRandomGift: boolean;
  isBoxGift: boolean;
  canPutInGiftBox: boolean;
  giftBoxInfo?: any;
}

export interface TikTokRawPriority {
  queueSizesList: string[];
  selfQueuePriority: string;
  priority: string;
}

export interface TikTokRawTrayInfo {
  mDynamicImg?: TikTokRawImage;
  canMirror: boolean;
  trayNormalBgImg?: TikTokRawImage;
  trayNormalBgColor: any[];
  traySmallBgImg?: TikTokRawImage;
  traySmallBgColor: any[];
  rightTagText?: any;
  rightTagBgImg?: TikTokRawImage;
  rightTagBgColor: any[];
  trayNameTextColor: string;
  trayDescTextColor: string;
  rightTagJumpSchema: string;
}

export interface TikTokRawGiftExtra {
  anchorId: string;
  profitApiMessageDur: string;
  sendGiftProfitApiStartMs: string;
  sendGiftProfitCoreStartMs: string;
  sendGiftReqStartMs: string;
  sendGiftSendMessageSuccessMs: string;
  sendProfitApiDur: string;
  toUserId: string;
  sendGiftStartClientLocalMs: string;
  fromPlatform: string;
  fromVersion: string;
}

export interface TikTokRawUserIdentity {
  isGiftGiverOfAnchor: boolean;
  isSubscriberOfAnchor: boolean;
  isMutualFollowingWithAnchor: boolean;
  isFollowerOfAnchor: boolean;
  isModeratorOfAnchor: boolean;
  isAnchor: boolean;
}

export interface TikTokRawResourceModel {
  urlList: string[];
  uri: string;
}

export interface TikTokRawVideoResource {
  [key: string]: any;
}

export interface TikTokRawAsset {
  name: string;
  resourceUri: string;
  resourceModel: TikTokRawResourceModel;
  describe: string;
  id: string;
  resourceType: number;
  md5: string;
  size: string;
  lokiExtraContent?: any;
  downloadType: number;
  resourceByteVC1Model?: any;
  bytevc1Md5: string;
  videoResourceList: TikTokRawVideoResource[];
  faceRecognitionArchiveMeta?: any;
  lynxUrlSettingsKey: string;
  downgradeResourceType: number;
  assetExtra?: any;
  stickerAssetVariant: number;
  immediateDownload: boolean;
  stickerAssetVariantReason: number;
}

export interface TikTokRawSponsorshipInfo {
  giftId: string;
  sponsorId: string;
  lightGiftUp: boolean;
  unlightedGiftIcon: string;
  giftGalleryDetailPageSchemeUrl: string;
  giftGalleryClickSponsor: boolean;
  becomeAllSponsored: boolean;
}

export interface TikTokRawCreatorSuccessInfo {
  tags: any[];
  topic: any;
}

export interface TikTokRawPortraitInfo {
  userMetrics: any[];
  portraitTag: any[];
}

export interface TikTokRawUserInteractionInfo {
  likeCnt: string;
  commentCnt: string;
  shareCnt: string;
}

export interface TikTokRawPublicAreaMessageCommon {
  scrollGapCount: string;
  anchorScrollGapCount: string;
  releaseToScrollArea: boolean;
  anchorReleaseToScrollArea: boolean;
  isAnchorMarked: boolean;
  creatorSuccessInfo: TikTokRawCreatorSuccessInfo;
  portraitInfo: TikTokRawPortraitInfo;
  userInteractionInfo: TikTokRawUserInteractionInfo;
  adminFoldType: string;
}

export interface TikTokRawGiftEvent {
  common: TikTokRawCommon;
  giftId: number;
  user: TikTokRawUser;
  repeatEnd: number;
  groupId: string;
  giftDetails: TikTokRawGiftDetails;
  monitorExtra: string;
  fanTicketCount: string;
  groupCount: number;
  repeatCount: number;
  comboCount: number;
  toUser?: TikTokRawUser;
  textEffect?: any;
  incomeTaskgifts: string;
  roomFanTicketCount: string;
  priority: TikTokRawPriority;
  logId: string;
  sendType: string;
  publicAreaCommon?: any;
  trayDisplayText: TikTokRawDisplayText;
  bannedDisplayEffects: string;
  mTrayInfo: TikTokRawTrayInfo;
  giftExtra: TikTokRawGiftExtra;
  colorId: string;
  isFirstSent: boolean;
  displayTextForAnchor?: TikTokRawDisplayText;
  displayTextForAudience?: TikTokRawDisplayText;
  orderId: string;
  giftsInBox?: any;
  msgFilter?: any;
  lynxExtra: any[];
  userIdentity: TikTokRawUserIdentity;
  matchInfo?: any;
  linkmicGiftExpressionStrategy: number;
  flyingMicResources?: any;
  disableGiftTracking: boolean;
  asset: TikTokRawAsset;
  version: number;
  sponsorshipInfo: TikTokRawSponsorshipInfo[];
  flyingMicResourcesV2?: any;
  publicAreaMessageCommon: TikTokRawPublicAreaMessageCommon;
  signature: string;
  signatureVersion: string;
  multiGenerateMessage: boolean;
  toMemberId: string;
  toMemberIdInt: string;
  toMemberNickname: string;
  interactiveGiftInfo?: any;
}

// ============================================================================
// Automation Trigger Types
// ============================================================================

export interface AutomationTriggerConfig {
  type: "tiktok_event";
  event: TikTokEventType;
  // Optional conditions
  giftId?: string; // For gifts: specific gift ID
  minValue?: number; // For gifts: minimum gift value
  keyword?: string; // For comments: keyword to match
  exactMatch?: boolean; // For comments: exact vs contains
}

// ============================================================================
// Decay Configuration Types
// ============================================================================

export interface DecayConfig {
  enabled: boolean;
  decayAmount: number; // Percentage to decrease (e.g., 5 means -5%)
  decayInterval: number; // Milliseconds between decay ticks (e.g., 10000 = 10s)
  addTimePerEvent: number; // Milliseconds to add per event (e.g., 10000 = 10s)
  maxAccumulatedTime?: number; // Optional max cap in milliseconds (default: 300000 = 5min)
}

export interface AutomationActionConfig {
  type: "setBrightness" | "incrementBrightness" | "setColor" | "randomColors";
  brightness?: number;
  increment?: number;
  color?: string;
  duration?: number;
  decayConfig?: DecayConfig; // Optional decay configuration for incrementBrightness
}

export interface LoadedAutomation {
  id: number;
  name: string;
  enabled: boolean;
  triggerConfig: AutomationTriggerConfig;
  actionConfig: AutomationActionConfig;
  selectedLights: string[];
}

// ============================================================================
// Service Configuration Types
// ============================================================================

export interface ServiceConfig {
  // TikTok configuration
  tiktokHandle: string;

  // Hue configuration
  hueIp: string;
  hueUsername: string;

  // Environment
  logLevel: string;
  nodeEnv: string;
  dbFileName: string;

  // Service settings
  automationRefreshInterval: number; // milliseconds
  streamRetryInterval?: number; // milliseconds - retry interval for stream connection
  automationsEnabled: boolean; // global flag to enable/disable all automations
}

// ============================================================================
// Event Matching Types
// ============================================================================

export interface EventMatchResult {
  matched: boolean;
  automation?: LoadedAutomation;
  reason?: string;
}
