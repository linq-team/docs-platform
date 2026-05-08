// Conditionally load DocsChat only if it is enabled
// this way the virtual module imports aren’t evaluated and don’t cause errors when the feature is disabled

// This conditional can’t be inlined into PageFrame because it breaks Astro’s static analysis of imports of client islands
const AiChat = __STLDOCS_ENABLE_AI_CHAT__ ? (await import('../chat/ui/AiChat')).default : null;

export default function DocsChatLazy(
  props: Omit<React.ComponentProps<NonNullable<typeof AiChat>>, 'stainlessProject'>,
) {
  if (!AiChat) return null;
  return <AiChat {...props} />;
}
