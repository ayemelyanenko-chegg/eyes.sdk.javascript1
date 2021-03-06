import * as utils from '@applitools/utils'
import AccessibilityRegionType from '../enums/AccessibilityRegionType'
import MatchLevel from '../enums/MatchLevel'
import RegionData, {Region} from './Region'

type RegionReference<TElement, TSelector> = Region | RegionData | ElementReference<TElement, TSelector>

type ElementReference<TElement, TSelector> = TElement | TSelector

type FrameReference<TElement, TSelector> = ElementReference<TElement, TSelector> | string | number

type ContextReference<TElement, TSelector> = {
  frame: FrameReference<TElement, TSelector>
  scrollRootElement?: ElementReference<TElement, TSelector>
}

type FloatingRegionReference<TElement, TSelector> = {
  region: RegionReference<TElement, TSelector>
  maxUpOffset?: number
  maxDownOffset?: number
  maxLeftOffset?: number
  maxRightOffset?: number
}

type AccessibilityRegionReference<TElement, TSelector> = {
  region: RegionReference<TElement, TSelector>
  type?: AccessibilityRegionType
}

export type CheckSettingsSpec<TElement, TSelector> = {
  isElement(value: any): value is TElement
  isSelector(value: any): value is TSelector
}

export type CheckSettings<TElement, TSelector> = {
  name?: string
  region?: RegionReference<TElement, TSelector>
  frames?: (ContextReference<TElement, TSelector> | FrameReference<TElement, TSelector>)[]
  scrollRootElement?: ElementReference<TElement, TSelector>
  isFully?: boolean
  matchLevel?: MatchLevel
  useDom?: boolean
  sendDom?: boolean
  enablePatterns?: boolean
  ignoreDisplacements?: boolean
  ignoreCaret?: boolean
  ignoreRegions?: RegionReference<TElement, TSelector>[]
  layoutRegions?: RegionReference<TElement, TSelector>[]
  strictRegions?: RegionReference<TElement, TSelector>[]
  contentRegions?: RegionReference<TElement, TSelector>[]
  floatingRegions?: (FloatingRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>)[]
  accessibilityRegions?: (AccessibilityRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>)[]
  disableBrowserFetching?: boolean
  layoutBreakpoints?: boolean | number[]
  visualGridOptions?: {[key: string]: any}
  hooks?: {[key: string]: string}
  renderId?: string
  timeout?: number
}

export default abstract class CheckSettingsFluent<TElement = unknown, TSelector = unknown> {
  protected abstract _spec: CheckSettingsSpec<TElement, TSelector>

  private _settings: CheckSettings<TElement, TSelector> = {}

  constructor(settings?: CheckSettings<TElement, TSelector>) {
    if (!settings) return this
    if (settings.name) this.name(settings.name)
    if (settings.region) this.region(settings.region)
    if (settings.frames) {
      settings.frames.forEach(reference => {
        if (utils.types.isNull(reference)) return
        if (utils.types.has(reference, 'frame')) {
          this.frame(reference.frame, reference.scrollRootElement)
        } else {
          this.frame(reference)
        }
      })
    }
    if (settings.scrollRootElement) this.scrollRootElement(settings.scrollRootElement)
    if (!utils.types.isNull(settings.isFully)) this.fully(settings.isFully)
    if (settings.matchLevel) this.matchLevel(settings.matchLevel)
    if (!utils.types.isNull(settings.useDom)) this.useDom(settings.useDom)
    if (!utils.types.isNull(settings.sendDom)) this.sendDom(settings.sendDom)
    if (!utils.types.isNull(settings.enablePatterns)) this.enablePatterns(settings.enablePatterns)
    if (!utils.types.isNull(settings.ignoreDisplacements)) this.ignoreDisplacements(settings.ignoreDisplacements)
    if (!utils.types.isNull(settings.ignoreCaret)) this.ignoreCaret(settings.ignoreCaret)
    if (settings.ignoreRegions) {
      settings.ignoreRegions.forEach(ignoreRegion => this.ignoreRegion(ignoreRegion))
    }
    if (settings.layoutRegions) {
      settings.layoutRegions.forEach(layoutRegion => this.layoutRegion(layoutRegion))
    }
    if (settings.strictRegions) {
      settings.strictRegions.forEach(strictRegion => this.strictRegion(strictRegion))
    }
    if (settings.contentRegions) {
      settings.contentRegions.forEach(contentRegion => this.contentRegion(contentRegion))
    }
    if (settings.floatingRegions) {
      settings.floatingRegions.forEach(floatingRegion =>
        this.floatingRegion(floatingRegion as FloatingRegionReference<TElement, TSelector>),
      )
    }
    if (settings.accessibilityRegions) {
      settings.accessibilityRegions.forEach(accessibilityRegion =>
        this.accessibilityRegion(accessibilityRegion as AccessibilityRegionReference<TElement, TSelector>),
      )
    }
    if (!utils.types.isNull(settings.disableBrowserFetching))
      this.disableBrowserFetching(settings.disableBrowserFetching)
    if (!utils.types.isNull(settings.layoutBreakpoints)) this.layoutBreakpoints(settings.layoutBreakpoints)
    if (settings.hooks) {
      Object.entries(settings.hooks).forEach(([name, script]) => this.hook(name, script))
    }
    if (settings.visualGridOptions) {
      Object.entries(settings.visualGridOptions).forEach(([key, value]) => this.visualGridOption(key, value))
    }
    if (settings.renderId) this.renderId(settings.renderId)
    if (!utils.types.isNull(settings.timeout)) this.timeout(settings.timeout)
  }

  isFrameReference(value: any): value is FrameReference<TSelector, TElement> {
    return utils.types.isNumber(value) || utils.types.isString(value) || this.isElementReference(value)
  }

  isRegionReference(value: any): value is RegionReference<TSelector, TElement> {
    return (
      utils.types.has(value, ['x', 'y', 'width', 'height']) ||
      utils.types.has(value, ['left', 'top', 'width', 'height']) ||
      this.isElementReference(value)
    )
  }

  isElementReference(value: any): value is ElementReference<TSelector, TElement> {
    return this._spec.isElement(value) || this._spec.isSelector(value)
  }

  name(name: string): this {
    utils.guard.isString(name, {name: 'name'})
    this._settings.name = name
    return this
  }
  withName(name: string) {
    return this.name(name)
  }

  region(region: RegionReference<TElement, TSelector>): this {
    utils.guard.custom(region, value => this.isRegionReference(value), {name: 'region'})
    this._settings.region = region
    return this
  }

  frame(context: ContextReference<TElement, TSelector>): this
  frame(frame: FrameReference<TElement, TSelector>, scrollRootElement?: ElementReference<TElement, TSelector>): this
  frame(
    contextOrFrame: ContextReference<TElement, TSelector> | FrameReference<TElement, TSelector>,
    scrollRootElement?: ElementReference<TElement, TSelector>,
  ): this {
    const context = utils.types.has(contextOrFrame, 'frame')
      ? contextOrFrame
      : {frame: contextOrFrame, scrollRootElement}
    if (!this._settings.frames) this._settings.frames = []
    utils.guard.custom(context.frame, value => this.isFrameReference(value), {name: 'frame'})
    utils.guard.custom(context.scrollRootElement, value => this.isElementReference(value), {
      name: 'scrollRootElement',
      strict: false,
    })
    this._settings.frames.push(context)
    return this
  }

  ignoreRegion(ignoreRegion: RegionReference<TElement, TSelector>): this {
    if (!this._settings.ignoreRegions) this._settings.ignoreRegions = []
    this._settings.ignoreRegions.push(ignoreRegion)
    return this
  }
  ignoreRegions(...ignoreRegions: RegionReference<TElement, TSelector>[]): this {
    ignoreRegions.forEach(ignoreRegion => this.ignoreRegion(ignoreRegion))
    return this
  }
  ignore(ignoreRegion: RegionReference<TElement, TSelector>) {
    return this.ignoreRegion(ignoreRegion)
  }
  ignores(...ignoreRegions: RegionReference<TElement, TSelector>[]): this {
    return this.ignoreRegions(...ignoreRegions)
  }

  layoutRegion(layoutRegion: RegionReference<TElement, TSelector>): this {
    if (!this._settings.layoutRegions) this._settings.layoutRegions = []
    this._settings.layoutRegions.push(layoutRegion)
    return this
  }
  layoutRegions(...layoutRegions: RegionReference<TElement, TSelector>[]): this {
    layoutRegions.forEach(layoutRegion => this.layoutRegion(layoutRegion))
    return this
  }

  strictRegion(strictRegion: RegionReference<TElement, TSelector>): this {
    if (!this._settings.strictRegions) this._settings.strictRegions = []
    this._settings.strictRegions.push(strictRegion)
    return this
  }
  strictRegions(...regions: RegionReference<TElement, TSelector>[]): this {
    regions.forEach(region => this.strictRegion(region))
    return this
  }

  contentRegion(region: RegionReference<TElement, TSelector>): this {
    if (!this._settings.contentRegions) this._settings.contentRegions = []
    this._settings.contentRegions.push(region)
    return this
  }
  contentRegions(...regions: RegionReference<TElement, TSelector>[]): this {
    regions.forEach(region => this.contentRegion(region))
    return this
  }

  floatingRegion(region: FloatingRegionReference<TElement, TSelector>): this
  floatingRegion(
    region: RegionReference<TElement, TSelector>,
    maxUpOffset?: number,
    maxDownOffset?: number,
    maxLeftOffset?: number,
    maxRightOffset?: number,
  ): this
  floatingRegion(
    region: FloatingRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>,
    maxUpOffset?: number,
    maxDownOffset?: number,
    maxLeftOffset?: number,
    maxRightOffset?: number,
  ): this {
    const floatingRegion = utils.types.has(region, 'region')
      ? region
      : {region, maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset}
    utils.guard.custom(floatingRegion.region, value => this.isRegionReference(value), {
      name: 'region',
    })
    utils.guard.isNumber(floatingRegion.maxUpOffset, {name: 'region'})
    utils.guard.isNumber(floatingRegion.maxDownOffset, {name: 'region'})
    utils.guard.isNumber(floatingRegion.maxLeftOffset, {name: 'region'})
    utils.guard.isNumber(floatingRegion.maxRightOffset, {name: 'region'})
    if (!this._settings.floatingRegions) this._settings.floatingRegions = []
    this._settings.floatingRegions.push(floatingRegion)
    return this
  }
  floatingRegions(
    ...regions: (FloatingRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>)[]
  ): this
  floatingRegions(maxOffset: number, ...regions: RegionReference<TElement, TSelector>[]): this
  floatingRegions(
    regionOrMaxOffset: FloatingRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector> | number,
    ...regions: (FloatingRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>)[]
  ): this {
    if (utils.types.isNumber(regionOrMaxOffset)) {
      const maxOffset = regionOrMaxOffset
      regions.forEach((region: RegionReference<TElement, TSelector>) =>
        this.floatingRegion({
          region,
          maxUpOffset: maxOffset,
          maxDownOffset: maxOffset,
          maxLeftOffset: maxOffset,
          maxRightOffset: maxOffset,
        }),
      )
    } else {
      this.floatingRegion(regionOrMaxOffset as FloatingRegionReference<TElement, TSelector>)
      regions.forEach((floatingRegion: FloatingRegionReference<TElement, TSelector>) =>
        this.floatingRegion(floatingRegion),
      )
    }
    return this
  }
  floating(region: FloatingRegionReference<TElement, TSelector>): this
  floating(region: RegionReference<TElement, TSelector>): this
  floating(
    region: FloatingRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>,
    maxUpOffset?: number,
    maxDownOffset?: number,
    maxLeftOffset?: number,
    maxRightOffset?: number,
  ): this {
    return this.floatingRegion(
      region as RegionReference<TElement, TSelector>,
      maxUpOffset,
      maxDownOffset,
      maxLeftOffset,
      maxRightOffset,
    )
  }
  floatings(...regions: (FloatingRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>)[]): this
  floatings(maxOffset: number, ...regions: RegionReference<TElement, TSelector>[]): this
  floatings(
    regionOrMaxOffset: FloatingRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector> | number,
    ...regions: (FloatingRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>)[]
  ): this {
    return this.floatingRegions(regionOrMaxOffset as number, ...(regions as RegionReference<TElement, TSelector>[]))
  }

  accessibilityRegion(region: AccessibilityRegionReference<TElement, TSelector>): this
  accessibilityRegion(region: RegionReference<TElement, TSelector>, type?: AccessibilityRegionType): this
  accessibilityRegion(
    region: AccessibilityRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>,
    type?: AccessibilityRegionType,
  ): this {
    const accessibilityRegion = utils.types.has(region, 'region') ? region : {region, type}
    utils.guard.custom(accessibilityRegion.region, value => this.isRegionReference(value), {
      name: 'region',
    })
    utils.guard.isEnumValue(accessibilityRegion.type, AccessibilityRegionType, {
      name: 'type',
      strict: false,
    })
    if (!this._settings.accessibilityRegions) this._settings.accessibilityRegions = []
    this._settings.accessibilityRegions.push(accessibilityRegion)
    return this
  }
  accessibilityRegions(
    ...regions: (AccessibilityRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>)[]
  ): this
  accessibilityRegions(type: AccessibilityRegionType, ...regions: RegionReference<TElement, TSelector>[]): this
  accessibilityRegions(
    regionOrType:
      | AccessibilityRegionReference<TElement, TSelector>
      | RegionReference<TElement, TSelector>
      | AccessibilityRegionType,
    ...regions: (AccessibilityRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>)[]
  ): this {
    if (utils.types.isEnumValue(regionOrType, AccessibilityRegionType)) {
      const type = regionOrType
      regions.forEach((region: RegionReference<TElement, TSelector>) => this.accessibilityRegion({region, type}))
    } else {
      this.accessibilityRegion(regionOrType as AccessibilityRegionReference<TElement, TSelector>)
      regions.forEach((floatingRegion: AccessibilityRegionReference<TElement, TSelector>) =>
        this.accessibilityRegion(floatingRegion),
      )
    }
    return this
  }
  accessibility(region: AccessibilityRegionReference<TElement, TSelector>): this
  accessibility(region: RegionReference<TElement, TSelector>, type?: AccessibilityRegionType): this
  accessibility(
    region: AccessibilityRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>,
    type?: AccessibilityRegionType,
  ): this {
    return this.accessibilityRegion(region as RegionReference<TElement, TSelector>, type)
  }
  accessibilities(
    ...regions: (AccessibilityRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>)[]
  ): this
  accessibilities(type: AccessibilityRegionType, ...regions: RegionReference<TElement, TSelector>[]): this
  accessibilities(
    regionOrType:
      | AccessibilityRegionReference<TElement, TSelector>
      | RegionReference<TElement, TSelector>
      | AccessibilityRegionType,
    ...regions: (AccessibilityRegionReference<TElement, TSelector> | RegionReference<TElement, TSelector>)[]
  ): this {
    return this.accessibilityRegions(
      regionOrType as AccessibilityRegionType,
      ...(regions as RegionReference<TElement, TSelector>[]),
    )
  }

  scrollRootElement(scrollRootElement: ElementReference<TElement, TSelector>): this {
    utils.guard.custom(scrollRootElement, value => this.isElementReference(value), {
      name: 'scrollRootElement',
    })
    if (this._settings.frames && this._settings.frames.length > 0) {
      const context = this._settings.frames[this._settings.frames.length - 1] as ContextReference<TElement, TSelector>
      context.scrollRootElement = scrollRootElement
    }
    this._settings.scrollRootElement = scrollRootElement
    return this
  }

  fully(isFully = true): this {
    utils.guard.isBoolean(isFully, {name: 'isFully'})
    this._settings.isFully = isFully
    return this
  }

  /** @deprecated */
  stitchContent(stitchContent = true) {
    return this.fully(stitchContent)
  }

  matchLevel(matchLevel: MatchLevel): this {
    utils.guard.isEnumValue(matchLevel, MatchLevel, {name: 'matchLevel'})
    this._settings.matchLevel = matchLevel
    return this
  }

  layout(): this {
    this._settings.matchLevel = MatchLevel.Layout
    return this
  }

  exact(): this {
    this._settings.matchLevel = MatchLevel.Exact
    return this
  }

  strict(): this {
    this._settings.matchLevel = MatchLevel.Strict
    return this
  }

  content(): this {
    this._settings.matchLevel = MatchLevel.Content
    return this
  }

  useDom(useDom = true): this {
    utils.guard.isBoolean(useDom, {name: 'useDom'})
    this._settings.useDom = useDom
    return this
  }

  sendDom(sendDom = true): this {
    utils.guard.isBoolean(sendDom, {name: 'sendDom'})
    this._settings.sendDom = sendDom
    return this
  }

  enablePatterns(enablePatterns = true): this {
    utils.guard.isBoolean(enablePatterns, {name: 'enablePatterns'})
    this._settings.enablePatterns = enablePatterns
    return this
  }

  ignoreDisplacements(ignoreDisplacements = true): this {
    utils.guard.isBoolean(ignoreDisplacements, {name: 'ignoreDisplacements'})
    this._settings.ignoreDisplacements = ignoreDisplacements
    return this
  }

  ignoreCaret(ignoreCaret = true): this {
    utils.guard.isBoolean(ignoreCaret, {name: 'ignoreCaret'})
    this._settings.ignoreCaret = ignoreCaret
    return this
  }

  disableBrowserFetching(disableBrowserFetching: boolean): this {
    utils.guard.isBoolean(disableBrowserFetching, {name: 'disableBrowserFetching'})
    this._settings.disableBrowserFetching = disableBrowserFetching
    return this
  }

  layoutBreakpoints(layoutBreakpoints: boolean | number[] = true): this {
    if (!utils.types.isArray(layoutBreakpoints)) {
      this._settings.layoutBreakpoints = layoutBreakpoints
    } else if (layoutBreakpoints.length === 0) {
      this._settings.layoutBreakpoints = false
    } else {
      this._settings.layoutBreakpoints = Array.from(new Set(layoutBreakpoints)).sort((a, b) => (a < b ? 1 : -1))
    }
    return this
  }

  hook(name: string, script: string): this {
    this._settings.hooks[name] = script
    return this
  }

  beforeRenderScreenshotHook(script: string): this {
    return this.hook('beforeCaptureScreenshot', script)
  }

  /** @deprecated */
  webHook(script: string): this {
    return this.beforeRenderScreenshotHook(script)
  }

  visualGridOption(key: string, value: any) {
    if (!this._settings.visualGridOptions) this._settings.visualGridOptions = {}
    this._settings.visualGridOptions[key] = value
    return this
  }
  visualGridOptions(options: {[key: string]: any}) {
    this._settings.visualGridOptions = options
    return this
  }

  renderId(renderId: string): this {
    utils.guard.isString(renderId, {name: 'renderId'})
    this._settings.renderId = renderId
    return this
  }

  timeout(timeout: number): this {
    utils.guard.isNumber(timeout, {name: 'timeout'})
    this._settings.timeout = timeout
    return this
  }

  toJSON(): CheckSettings<TElement, TSelector> {
    // TODO create a plain object
    return {}
  }
}
