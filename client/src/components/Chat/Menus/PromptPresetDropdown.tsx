import React, { useCallback, useMemo } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { EModelEndpoint, PermissionTypes, Permissions } from 'librechat-data-provider';
import type { TStartupConfig } from 'librechat-data-provider';
import type { FC } from 'react';
import { CustomMenu, CustomMenuItem } from './Endpoints/CustomMenu';
import { useSetIndexOptions, useLocalize, useHasAccess } from '~/hooks';
import { useChatContext } from '~/Providers';
import { useGetAllPromptGroups } from '~/data-provider';

type StartupConfigWithPresets = TStartupConfig & {
  promptPresets?: Array<{ label: string; prompt: string }>;
};

type PromptPresetDropdownProps = {
  startupConfig: StartupConfigWithPresets | undefined;
};

const PromptPresetDropdown: FC<PromptPresetDropdownProps> = ({ startupConfig }) => {
  const localize = useLocalize();
  const { conversation } = useChatContext();
  const { setOption } = useSetIndexOptions();
  const hasPromptAccess = useHasAccess({
    permissionType: PermissionTypes.PROMPTS,
    permission: Permissions.USE,
  });
  const { data: allPromptGroups = [] } = useGetAllPromptGroups(undefined, {
    enabled: hasPromptAccess,
  });

  const envPresets = useMemo(
    () => startupConfig?.promptPresets?.filter((p) => p?.label && p?.prompt) ?? [],
    [startupConfig?.promptPresets],
  );

  const userPresets = useMemo(() => {
    if (!Array.isArray(allPromptGroups)) {
      return [];
    }
    return allPromptGroups
      .map((group) => ({
        _id: group._id,
        label: group.name ?? '',
        prompt: (group.productionPrompt?.prompt ?? '').trim(),
      }))
      .filter((p) => p.label && p.prompt);
  }, [allPromptGroups]);

  const presets = useMemo(
    () => [
      ...envPresets.map((p) => ({ ...p, _id: undefined as string | undefined })),
      ...userPresets,
    ],
    [envPresets, userPresets],
  );

  const isBedrock = conversation?.endpoint === EModelEndpoint.bedrock;
  const currentPrompt = isBedrock ? conversation?.system : conversation?.promptPrefix;
  const setSystemPrompt = setOption(isBedrock ? 'system' : 'promptPrefix');

  // Show preset name by matching current conversation prompt to a preset (so it persists across reload/navigation)
  const selectedIndex = useMemo(() => {
    const prompt = typeof currentPrompt === 'string' ? currentPrompt.trim() : '';
    if (!prompt) {
      return null;
    }
    const idx = presets.findIndex((p) => p.prompt.trim() === prompt);
    return idx >= 0 ? idx : null;
  }, [currentPrompt, presets]);

  const onSelect = useCallback(
    (index: number) => {
      const preset = presets[index];
      if (!preset) {
        return;
      }
      setSystemPrompt(preset.prompt);
    },
    [presets, setSystemPrompt],
  );

  const displayLabel =
    selectedIndex != null && presets[selectedIndex]
      ? presets[selectedIndex].label
      : localize('com_endpoint_prompt_preset');

  const trigger = (
    <TooltipAnchor
      aria-label={displayLabel}
      description={displayLabel}
      render={
        <button
          type="button"
          className="my-1 flex h-10 min-w-[140px] max-w-[280px] items-center justify-center gap-2 rounded-xl border border-border-light bg-presentation px-3 py-2 text-sm text-text-primary hover:bg-surface-active-alt"
          aria-label={displayLabel}
          title={displayLabel}
        >
          <FileText className="icon-sm flex-shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
            {displayLabel}
          </span>
          <ChevronDown className="icon-sm flex-shrink-0 opacity-75" aria-hidden="true" />
        </button>
      }
    />
  );

  if (presets.length === 0) {
    return null;
  }

  return (
    <div className="relative flex w-full min-w-[180px] max-w-[280px] flex-col items-center gap-2">
      <CustomMenu
        placement="bottom"
        values={{ promptPreset: selectedIndex != null ? String(selectedIndex) : '' }}
        onValuesChange={(values) => {
          const v = values.promptPreset;
          if (v !== undefined && v !== '') {
            const idx = parseInt(v, 10);
            if (!Number.isNaN(idx) && idx >= 0 && idx < presets.length) {
              onSelect(idx);
            }
          }
        }}
        trigger={trigger}
      >
        {presets.map((preset, index) => (
          <CustomMenuItem
            key={preset._id ?? `env-${index}`}
            name="promptPreset"
            value={String(index)}
          >
            {preset.label}
          </CustomMenuItem>
        ))}
      </CustomMenu>
    </div>
  );
};

export default PromptPresetDropdown;
