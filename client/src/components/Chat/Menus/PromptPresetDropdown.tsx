import React, { useCallback, useMemo, useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { EModelEndpoint } from 'librechat-data-provider';
import type { TStartupConfig } from 'librechat-data-provider';
import type { FC } from 'react';
import { CustomMenu, CustomMenuItem } from './Endpoints/CustomMenu';
import { useSetIndexOptions, useLocalize } from '~/hooks';
import { useChatContext } from '~/Providers';

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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const presets = useMemo(
    () => startupConfig?.promptPresets?.filter((p) => p?.label && p?.prompt) ?? [],
    [startupConfig?.promptPresets],
  );

  const isBedrock = conversation?.endpoint === EModelEndpoint.bedrock;
  const setSystemPrompt = setOption(isBedrock ? 'system' : 'promptPrefix');

  const onSelect = useCallback(
    (index: number) => {
      const preset = presets[index];
      if (!preset) {
        return;
      }
      setSelectedIndex(index);
      setSystemPrompt(preset.prompt);
    },
    [presets, setSystemPrompt],
  );

  const displayLabel = selectedIndex != null && presets[selectedIndex]
    ? presets[selectedIndex].label
    : localize('com_endpoint_prompt_preset');

  const trigger = (
    <TooltipAnchor
      aria-label={displayLabel}
      description={displayLabel}
      render={
        <button
          type="button"
          className="my-1 flex h-10 min-w-0 max-w-[200px] items-center justify-center gap-2 rounded-xl border border-border-light bg-presentation px-3 py-2 text-sm text-text-primary hover:bg-surface-active-alt"
          aria-label={displayLabel}
        >
          <FileText className="icon-sm flex-shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-left">{displayLabel}</span>
          <ChevronDown className="icon-sm flex-shrink-0 opacity-75" aria-hidden="true" />
        </button>
      }
    />
  );

  if (presets.length === 0) {
    return null;
  }

  return (
    <div className="relative flex w-full min-w-0 max-w-[200px] flex-col items-center gap-2">
      <CustomMenu
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
            key={index}
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
