import {ChannelType} from '../config';

export const apiStorageUrl = process.env.REACT_APP_STORAGE_URL;

export const getLogoUrl = item => {
  if (item.logo) return getCombinedLogoUrl(item.logo);
  return `${apiStorageUrl}/icons/${item.type}/${item.code}.png`;
};

export const getCombinedLogoUrl = logo => {
  if (!logo) return '';

  if (logo.startsWith('http')) return logo;

  return `${apiStorageUrl}/${logo}`;
};

export const getChannelThumbnail = (channel, currentUserId) => {
  if (channel?.type === ChannelType.Private && currentUserId) {
    return channel?.privateUser1?.id === currentUserId
      ? channel?.privateUser2?.thumbnail
      : channel?.privateUser1?.thumbnail;
  }

  return getCombinedLogoUrl(channel?.thumbnail);
};
