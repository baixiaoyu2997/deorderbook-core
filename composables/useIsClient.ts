/**
 * 判断是否为client side
 */
export const useIsClient = () => typeof window !== 'undefined'
