/**
 * Used to mark a paragraph as chorus
 * @constant
 * @type {string}
 */
export const CHORUS = "chorus";
/**
 * Used to mark a paragraph as containing lines with both verse and chorus type
 * @constant
 * @type {string}
 */
export const INDETERMINATE = "indeterminate";
/**
 * Used to mark a paragraph as not containing a line marked with a type
 * @constant
 * @type {string}
 */
export const NONE = "none";
/**
 * Used to mark a paragraph as tab
 * @constant
 * @type {string}
 */
export const TAB = "tab";
/**
 * Used to mark a paragraph as verse
 * @constant
 * @type {string}
 */
export const VERSE = "verse";
/**
 * Used to mark a paragraph as part
 * @constant
 * @type {string}
 */
export const PART = "part";
/**
 * Used to mark a section as Lilypond notation
 * @constant
 * @type {string}
 */
export const LILYPOND = "ly";
/**
 * Used to mark a section as ABC music notation
 * @constant
 * @type {string}
 */
export const ABC = "abc";
export const SYMBOL = "symbol";
export const NUMERIC = "numeric";
export const NUMERAL = "numeral";
export const SOLFEGE = "solfege";
type Modifier = '#' | 'b';
type NoModifier = 'NM';
type ModifierMaybe = Modifier | NoModifier;
type ChordType = 'symbol' | 'solfege' | 'numeric' | 'numeral';
type FretNumber = number;
type OpenFret = '0';
type NonSoundingString = '-1' | 'N' | 'x';
type Fret = FretNumber | OpenFret | NonSoundingString;
/**
 * Represents a chord with the corresponding (partial) lyrics
 */
export class ChordLyricsPair {
    chords: string;
    lyrics: string | null;
    annotation: string | null;
    /**
     * Initialises a ChordLyricsPair
     * @param {string} chords The chords
     * @param {string | null} lyrics The lyrics
     * @param {string | null} annotation The annotation
     */
    constructor(chords?: string, lyrics?: string | null, annotation?: string | null);
    /**
     * Indicates whether a ChordLyricsPair should be visible in a formatted chord sheet (except for ChordPro sheets)
     * @returns {boolean}
     */
    isRenderable(): boolean;
    /**
     * Returns a deep copy of the ChordLyricsPair, useful when programmatically transforming a song
     * @returns {ChordLyricsPair}
     */
    clone(): ChordLyricsPair;
    toString(): string;
    set({ chords, lyrics, annotation }: {
        chords?: string;
        lyrics?: string;
        annotation?: string;
    }): ChordLyricsPair;
    setLyrics(lyrics: string): ChordLyricsPair;
    setAnnotation(annotation: string): ChordLyricsPair;
    transpose(delta: number, key?: string | Key | null, { normalizeChordSuffix }?: {
        normalizeChordSuffix: boolean;
    }): ChordLyricsPair;
    useModifier(modifier: Modifier): ChordLyricsPair;
    changeChord(func: (chord: Chord) => Chord): ChordLyricsPair;
}
/**
 * Represents a comment. See https://www.chordpro.org/chordpro/chordpro-file-format-specification/#overview
 */
export class Comment {
    content: string;
    constructor(content: string);
    /**
     * Indicates whether a Comment should be visible in a formatted chord sheet (except for ChordPro sheets)
     * @returns {boolean}
     */
    isRenderable(): boolean;
    /**
     * Returns a deep copy of the Comment, useful when programmatically transforming a song
     * @returns {Comment}
     */
    clone(): Comment;
    toString(): string;
}
interface TraceInfo {
    line?: number | null;
    column?: number | null;
    offset?: number | null;
}
declare abstract class AstComponent {
    line: number | null;
    column: number | null;
    offset: number | null;
    protected constructor(traceInfo?: TraceInfo | null);
    abstract clone(): AstComponent;
}
declare abstract class MetadataAccessors {
    abstract getMetadataValue(_name: string): string | string[] | null;
    abstract getSingleMetadataValue(_name: string): string | null;
    get key(): string | null;
    get title(): string | null;
    get subtitle(): string | null;
    get capo(): string | string[] | null;
    get duration(): string | null;
    get tempo(): string | null;
    get time(): string | string[] | null;
    get year(): string | null;
    get album(): string | string[] | null;
    get copyright(): string | null;
    get lyricist(): string | string[] | null;
    get artist(): string | string[] | null;
    get composer(): string | string[] | null;
}
/**
 * Represents a chord definition.
 *
 * Definitions are made using the `{chord}` or `{define}` directive.
 * A chord definitions overrides a previous chord definition for the exact same chord.
 *
 * @see https://chordpro.org/chordpro/directives-define/
 * @see https://chordpro.org/chordpro/directives-chord/
 */
export class ChordDefinition {
    /**
     * The chord name, e.g. `C`, `Dm`, `G7`.
     * @type {string}
     */
    name: string;
    /**
     * Defines the offset for the chord, which is the position of the topmost finger.
     * The offset must be 1 or higher.
     * @type {number}
     */
    baseFret: number;
    /**
     * Defines the string positions.
     * Strings are enumerated from left (lowest) to right (highest), as they appear in the chord diagrams.
     * Fret positions are relative to the offset minus one, so with base-fret 1 (the default),
     * the topmost fret position is 1. With base-fret 3, fret position 1 indicates the 3rd position.
     * `0` (zero) denotes an open string. Use `-1`, `N` or `x` to denote a non-sounding string.
     * @type {Fret[]}
     */
    frets: Fret[];
    /**
     * defines finger settings. This part may be omitted.
     *
     * For the frets and the fingers positions, there must be exactly as many positions as there are strings,
     * which is 6 by default. For the fingers positions, values corresponding to open or damped strings are ignored.
     * Finger settings may be numeric (0 .. 9) or uppercase letters (A .. Z).
     * Note that the values -, x, X, and N are used to designate a string without finger setting.
     * @type {number[]}
     */
    fingers: number[];
    constructor(name: string, baseFret: number, frets: Fret[], fingers?: number[]);
    /**
     * Parses a chord definition in the form of:
     * - <name> base-fret <offset> frets <pos> <pos> … <pos>
     * - <name> base-fret <offset> frets <pos> <pos> … <pos> fingers <pos> <pos> … <pos>
     * @param chordDefinition
     * @returns {ChordDefinition}
     * @see https://chordpro.org/chordpro/directives-define/#common-usage
     */
    static parse(chordDefinition: string): ChordDefinition;
    clone(): ChordDefinition;
}
/**
 * Represents a tag/directive. See https://www.chordpro.org/chordpro/chordpro-directives/
 */
export class Tag extends AstComponent {
    _isMetaTag: boolean;
    _originalName: string;
    _name: string;
    _value: string;
    chordDefinition?: ChordDefinition;
    selector: string | null;
    isNegated: boolean;
    /**
     * The tag attributes. For example, section related tags can have a label:
     * `{start_of_verse: label="Verse 1"}`
     * @type {Record<string, string>}
     */
    attributes: Record<string, string>;
    constructor(name: string, value?: string | null, traceInfo?: TraceInfo | null, attributes?: Record<string, string>, selector?: string | null, isNegated?: boolean);
    static parse(tag: string | Tag): Tag | null;
    static parseWithRegex(tag: string, regex: RegExp): Tag | null;
    static parseOrFail(tag: string | Tag): Tag;
    get label(): string;
    isSectionDelimiter(): boolean;
    isSectionStart(): boolean;
    isSectionEnd(): boolean;
    isInlineFontTag(): boolean;
    set name(name: string);
    /**
     * The tag full name. When the original tag used the short name, `name` will return the full name.
     * @member
     * @type {string}
     */
    get name(): string;
    /**
     * The original tag name that was used to construct the tag.
     * @member
     * @type {string}
     */
    get originalName(): string;
    set value(value: string);
    /**
     * The tag value
     * @member
     * @type {string}
     */
    get value(): string;
    /**
     * Checks whether the tag value is a non-empty string.
     * @returns {boolean}
     */
    hasValue(): boolean;
    hasAttributes(): boolean;
    hasLabel(): boolean;
    /**
     * Checks whether the tag is usually rendered inline. It currently only applies to comment tags.
     * @returns {boolean}
     */
    isRenderable(): boolean;
    /**
     * Check whether this tag's label (if any) should be rendered, as applicable to tags like
     * `start_of_verse` and `start_of_chorus`.
     * See https://chordpro.org/chordpro/directives-env_chorus/, https://chordpro.org/chordpro/directives-env_verse/,
     * https://chordpro.org/chordpro/directives-env_bridge/, https://chordpro.org/chordpro/directives-env_tab/
     */
    hasRenderableLabel(): boolean;
    /**
     * Checks whether the tag is either a standard meta tag or a custom meta directive (`{x_some_name}`)
     * @returns {boolean}
     */
    isMetaTag(): boolean;
    /**
     * Returns a clone of the tag.
     * @returns {Tag} The cloned tag
     */
    clone(): Tag;
    toString(): string;
    set({ value }: {
        value: string;
    }): Tag;
    setAttribute(name: string, value: string): Tag;
}
/**
 * Stores song metadata. Properties can be accessed using the get() method:
 *
 * const metadata = new Metadata({ author: 'John' });
 * metadata.get('author')   // => 'John'
 *
 * See {@link Metadata#get}
 */
export class Metadata extends MetadataAccessors {
    metadata: Record<string, string | string[]>;
    constructor(metadata?: Record<string, string | string[]> | Metadata);
    merge(metadata: Record<string, string | string[]>): Metadata;
    contains(key: string): boolean;
    add(key: string, value: string): void;
    appendValue(key: string, value: string): void;
    set(key: string, value: string | null): void;
    getMetadataValue(name: string): string | string[] | null;
    getSingleMetadataValue(name: string): string | null;
    /**
     * Reads a metadata value by key. This method supports simple value lookup, as well as fetching single array values.
     *
     * This method deprecates direct property access, eg: metadata['author']
     *
     * @example
     * const metadata = new Metadata({ lyricist: 'Pete', author: ['John', 'Mary'] });
     * metadata.get('lyricist') // => 'Pete'
     * metadata.get('author')   // => ['John', 'Mary']
     * metadata.get('author.1') // => 'John'
     * metadata.get('author.2') // => 'Mary'
     *
     * Using a negative index will start counting at the end of the list:
     *
     * const metadata = new Metadata({ lyricist: 'Pete', author: ['John', 'Mary'] });
     * metadata.get('author.-1') // => 'Mary'
     * metadata.get('author.-2') // => 'John'
     *
     * @param prop the property name
     * @returns {Array<String>|String} the metadata value(s). If there is only one value, it will return a String,
     * else it returns an array of strings.
     */
    get(prop: string): string | string[] | null;
    /**
     * Returns a single metadata value. If the actual value is an array, it returns the first value. Else, it returns
     * the value.
     * @ignore
     * @param {string} prop the property name
     * @returns {String} The metadata value
     */
    getSingle(prop: string): string | null;
    parseArrayKey(prop: string): [string, number] | null;
    getArrayItem(prop: string): string | null;
    /**
     * Returns a deep clone of this Metadata object
     * @returns {Metadata} the cloned Metadata object
     */
    clone(): Metadata;
    calculateKeyFromCapo(): string | null;
    assign(metadata: Record<string, string | string[] | null>): void;
}
declare abstract class Evaluatable extends AstComponent {
    abstract evaluate(_metadata: Metadata, _metadataSeparator: string, _variable?: string | null): string;
    abstract clone(): Evaluatable;
}
export class Literal extends Evaluatable {
    string: string;
    constructor(string: string);
    evaluate(): string;
    isRenderable(): boolean;
    clone(): Literal;
}
export class Composite extends Evaluatable {
    expressions: Evaluatable[];
    variable: string | null;
    constructor(expressions: Evaluatable[], variable?: string | null);
    evaluate(metadata: Metadata, metadataSeparator: string): string;
    isRenderable(): boolean;
    clone(): Composite;
}
type TernaryProperties = TraceInfo & {
    variable?: string | null;
    valueTest?: string | null;
    trueExpression?: Evaluatable[];
    falseExpression?: Evaluatable[];
};
export class Ternary extends Evaluatable {
    variable: string | null;
    valueTest: string | null;
    trueExpression: Evaluatable[];
    falseExpression: Evaluatable[];
    constructor({ variable, valueTest, trueExpression, falseExpression, line, column, offset, }: TernaryProperties);
    /**
     * Evaluate the meta expression
     * @param {Metadata} metadata The metadata object to use for evaluating the expression
     * @param {string} [metadataSeparator=null] The metadata separator to use if necessary
     * @returns {string} The evaluated expression
     */
    evaluate(metadata: Metadata, metadataSeparator: string, upperContext?: string | null): string;
    evaluateToString(value: string[] | string, metadataSeparator: string): string;
    evaluateWithVariable(metadata: Metadata, metadataSeparator: string): string;
    evaluateForTruthyValue(metadata: Metadata, metadataSeparator: string, value: string | string[]): string;
    isRenderable(): boolean;
    clone(): Ternary;
}
type Item = ChordLyricsPair | Comment | Tag | Ternary | Literal;
type Size = 'px' | '%';
declare class FontSize {
    /**
     * The size unit, either `"px"` or `"%"`
     * @member {string}
     */
    unit: Size;
    /**
     * The font size
     * @member {number}
     */
    fontSize: number;
    constructor(fontSize: number, kind: Size);
    clone(): FontSize;
    multiply(percentage: any): FontSize;
    /**
     * Stringifies the font size by concatenating size and unit
     *
     * @example
     * // Returns "30px"
     * new FontSize(30, 'px').toString()
     * @example
     * // Returns "120%"
     * new FontSize(120, '%').toString()
     *
     * @return {string} The font size
     */
    toString(): string;
    static parse(fontSize: string, parent: FontSize | null): FontSize;
    static parseNotANumber(parent: FontSize | null): FontSize;
    static parsePercentage(parsedFontSize: number, parent: FontSize | null): FontSize;
}
interface FontProperties {
    font?: string | null;
    size?: FontSize | null;
    colour?: string | null;
}
declare class Font {
    /**
     * The font
     * @member {string | null}
     */
    font: string | null;
    /**
     * The font size, expressed in either pixels or percentage.
     * @member {FontSize | null}
     */
    size: FontSize | null;
    /**
     * The font color
     * @member {string | null}
     */
    colour: string | null;
    constructor({ font, size, colour }?: FontProperties);
    clone(): Font;
    /**
     * Converts the font, size and color to a CSS string.
     * If possible, font and size are combined to the `font` shorthand.
     * If `font` contains double quotes (`"`) those will be converted to single quotes (`'`).
     *
     * @example
     * // Returns "font-family: 'Times New Roman'"
     * new Font({ font: '"Times New Roman"' }).toCssString()
     * @example
     * // Returns "color: red; font-family: Verdana"
     * new Font({ font: 'Verdana', colour: 'red' }).toCssString()
     * @example
     * // Returns "font: 30px Verdana"
     * new Font({ font: 'Verdana', size: '30' }).toCssString()
     * @example
     * // Returns "color: blue; font: 30% Verdana"
     * new Font({ font: 'Verdana', size: '30%', colour: 'blue' }).toCssString()
     *
     * @return {string} The CSS string
     */
    toCssString(): string;
}
interface SerializedTraceInfo {
    location?: {
        offset: number | null;
        line: number | null;
        column: number | null;
    };
}
interface SerializedChord {
    type: 'chord';
    base: string;
    modifier: Modifier | null;
    suffix: string | null;
    bassBase: string | null;
    bassModifier: Modifier | null;
    chordType: ChordType;
}
interface SerializedChordLyricsPair {
    type: 'chordLyricsPair';
    chord?: SerializedChord | null;
    chords: string;
    lyrics: string | null;
    annotation?: string | null;
}
interface SerializedChordDefinition {
    name: string;
    baseFret: number;
    frets: Fret[];
    fingers?: number[];
}
type SerializedTag = SerializedTraceInfo & {
    type: 'tag';
    name: string;
    value: string;
    chordDefinition?: SerializedChordDefinition;
    attributes?: Record<string, string>;
    selector?: string | null;
    isNegated?: boolean;
};
interface SerializedComment {
    type: 'comment';
    comment: string;
}
type ContentType = 'tab' | 'abc' | 'ly' | 'grid';
interface SerializedSection {
    type: 'section';
    sectionType: ContentType;
    content: string[];
    startTag: SerializedTag;
    endTag: SerializedTag;
}
type SerializedLiteral = string;
interface SerializedTernary extends SerializedTraceInfo {
    type: 'ternary';
    variable: string | null;
    valueTest: string | null;
    trueExpression: (SerializedLiteral | SerializedTernary)[];
    falseExpression: (SerializedLiteral | SerializedTernary)[];
}
interface SerializedSoftLineBreak {
    type: 'softLineBreak';
}
type SerializedItem = SerializedChordLyricsPair | SerializedComment | SerializedLiteral | SerializedSoftLineBreak | SerializedTag | SerializedTernary;
interface SerializedLine {
    type: 'line';
    items: SerializedItem[];
}
interface SerializedSong {
    type: 'chordSheet';
    lines: SerializedLine[];
}
type SerializedComponent = SerializedLine | SerializedSong | SerializedChordLyricsPair | SerializedTag | SerializedComment | SerializedTernary | SerializedLiteral | SerializedSection | SerializedSoftLineBreak;
type MapItemFunc = (_item: Item) => Item | null;
/**
 * Represents a line in a chord sheet, consisting of items of type ChordLyricsPair or Tag
 */
export class Line {
    /**
     * The items ({@link ChordLyricsPair} or {@link Tag} or {@link Comment}) of which the line consists
     * @type {Array.<(ChordLyricsPair|Tag|Comment)>}
     */
    items: Item[];
    /**
     * The line type, This is set by the ChordProParser when it read tags like {start_of_chorus} or {start_of_verse}
     * It uses the following mapping to determine the line type from directives:
     * - `start_of_abc` => {@link ABC}
     * - `start_of_bridge` => {@link BRIDGE}
     * - `start_of_chorus` => {@link CHORUS}
     * - `start_of_grid` => {@link GRID}
     * - `start_of_ly` => {@link LILYPOND}
     * - `start_of_tab` => {@link TAB}
     * - `start_of_verse` => {@link VERSE}
     *
     * There are two special cases:
     * - {@link INDETERMINATE} when the paragraph lines do not have a consistent type
     * - {@link NONE} when no type is derived
     * @type {string}
     */
    type: string;
    currentChordLyricsPair: ChordLyricsPair;
    key: string | null;
    transposeKey: string | null;
    lineNumber: number | null;
    selector: string | null;
    /**
     * The text font that applies to this line. Is derived from the directives:
     * `textfont`, `textsize` and `textcolour`
     * See: https://www.chordpro.org/chordpro/directives-props_text_legacy/
     * @type {Font}
     */
    textFont: Font;
    /**
     * The chord font that applies to this line. Is derived from the directives:
     * `chordfont`, `chordsize` and `chordcolour`
     * See: https://www.chordpro.org/chordpro/directives-props_chord_legacy/
     * @type {Font}
     */
    chordFont: Font;
    constructor({ type, items }?: {
        type: string;
        items: Item[];
    });
    /**
     * Indicates whether the line contains any items
     * @returns {boolean}
     */
    isEmpty(): boolean;
    /**
     * Adds an item ({@link ChordLyricsPair} or {@link Tag}) to the line
     * @param {ChordLyricsPair|Tag} item The item to be added
     */
    addItem(item: Item): void;
    /**
     * Indicates whether the line contains items that are renderable
     * @returns {boolean}
     */
    hasRenderableItems(): boolean;
    /**
     * Returns a deep copy of the line and all of its items
     * @returns {Line}
     */
    clone(): Line;
    mapItems(func: MapItemFunc | null): Line;
    /**
     * Indicates whether the line type is {@link BRIDGE}
     * @returns {boolean}
     */
    isBridge(): boolean;
    /**
     * Indicates whether the line type is {@link CHORUS}
     * @returns {boolean}
     */
    isChorus(): boolean;
    /**
     * Indicates whether the line type is {@link GRID}
     * @returns {boolean}
     */
    isGrid(): boolean;
    /**
     * Indicates whether the line type is {@link TAB}
     * @returns {boolean}
     */
    isTab(): boolean;
    /**
     * Indicates whether the line type is {@link VERSE}
     * @returns {boolean}
     */
    isVerse(): boolean;
    /**
     * Indicates whether the line type is {@link PART}
     * @returns {boolean}
     */
    isPart(): boolean;
    /**
     * Indicates whether the line contains items that are renderable. Please use {@link hasRenderableItems}
     * @deprecated
     * @returns {boolean}
     */
    hasContent(): boolean;
    addChordLyricsPair(chords?: ChordLyricsPair | string | null, lyrics?: null): ChordLyricsPair;
    ensureChordLyricsPair(): void;
    chords(chr: string): void;
    lyrics(chr: string): void;
    addTag(nameOrTag: Tag | string, value?: string | null): Tag;
    addComment(content: Comment | string): Comment;
    set(properties: {
        type?: string;
        items?: Item[];
    }): Line;
    get _tag(): Tag | null;
    isSectionStart(): boolean;
    isSectionEnd(): boolean;
}
declare function hasChordContents(line: Line): boolean;
declare function isEvaluatable(item: Item): boolean;
interface KeyProperties {
    grade?: number | null;
    number?: number | null;
    type?: ChordType;
    minor?: boolean;
    modifier?: Modifier | null;
    referenceKeyGrade?: number | null;
    preferredModifier?: Modifier | null;
}
interface ConstructorOptions {
    grade?: number | null;
    number?: number | null;
    minor: boolean;
    type: ChordType;
    modifier: Modifier | null;
    referenceKeyGrade?: number | null;
    originalKeyString?: string | null;
    preferredModifier: Modifier | null;
}
/**
 * Represents a key, such as Eb (symbol), #3 (numeric) or VII (numeral).
 *
 * The only function considered public API is `Key.distance`
 */
export class Key implements KeyProperties {
    grade: number | null;
    number: number | null;
    modifier: Modifier | null;
    type: ChordType;
    get unicodeModifier(): string | null;
    minor: boolean;
    referenceKeyGrade: number | null;
    originalKeyString: string | null;
    preferredModifier: Modifier | null;
    static parse(keyString: string | null): null | Key;
    static parseAsType(trimmed: string, keyType: ChordType): Key | null;
    static resolve({ key, keyType, minor, modifier, }: {
        key: string | number;
        keyType: ChordType;
        minor: string | boolean;
        modifier: Modifier | null;
    }): Key | null;
    static getNumberFromKey(keyString: string, keyType: ChordType): number;
    static keyWithModifier(key: string, modifier: Modifier | null, type: ChordType): string;
    static toGrade(key: string, modifier: ModifierMaybe, type: ChordType, isMinor: boolean): number | null;
    static isMinor(key: string, keyType: ChordType, minor: string | undefined | boolean): boolean;
    static parseOrFail(keyString: string | null): Key;
    static wrap(keyStringOrObject: Key | string | null): Key | null;
    static wrapOrFail(keyStringOrObject?: Key | string | null): Key;
    static toString(keyStringOrObject: Key | string): string;
    /**
     * Calculates the distance in semitones between one key and another.
     * @param {Key | string} oneKey the key
     * @param {Key | string} otherKey the other key
     * @return {number} the distance in semitones
     */
    static distance(oneKey: Key | string, otherKey: Key | string): number;
    constructor({ grade, number, minor, type, modifier, referenceKeyGrade, originalKeyString, preferredModifier, }: ConstructorOptions);
    distanceTo(otherKey: Key | string): number;
    get effectiveGrade(): number;
    isMinor(): boolean;
    makeMinor(): Key;
    get relativeMajor(): Key;
    get relativeMinor(): Key;
    toMajor(): Key;
    clone(): Key;
    toChordSymbol(key: Key | string): Key;
    toChordSolfege(key: Key | string): Key;
    toChordSymbolString(key: Key): string;
    toChordSolfegeString(key: Key): string;
    is(type: ChordType): boolean;
    isNumeric(): boolean;
    isChordSymbol(): boolean;
    isChordSolfege(): boolean;
    isNumeral(): boolean;
    equals(otherKey: Key): boolean;
    static equals(oneKey: Key | null, otherKey: Key | null): boolean;
    toNumeric(key?: Key | string | null): Key;
    toNumericString(key?: Key | null): string;
    toNumeral(key?: Key | string | null): Key;
    toNumeralString(key?: Key | null): string;
    toString({ showMinor, useUnicodeModifier }?: {
        showMinor?: boolean | undefined;
        useUnicodeModifier?: boolean | undefined;
    }): string;
    get note(): string;
    get minorSign(): "" | "m";
    transpose(delta: number): Key;
    changeGrade(delta: any): Key;
    transposeUp(): Key;
    transposeDown(): Key;
    canBeFlat(): boolean;
    canBeSharp(): boolean;
    setGrade(newGrade: number): Key;
    static shiftGrade(grade: number): any;
    useModifier(newModifier: Modifier | null): Key;
    normalize(): Key;
    normalizeEnharmonics(key: Key | string | null): Key;
}
interface ChordProperties {
    root?: Key | null;
    suffix?: string | null;
    bass?: Key | null;
}
interface ChordConstructorOptions {
    base?: string | number | null;
    modifier?: Modifier | null;
    suffix?: string | null;
    bassBase?: string | number | null;
    bassModifier?: Modifier | null;
    root?: Key | null;
    bass?: Key | null;
    chordType?: ChordType | null;
}
/**
 * Represents a Chord, consisting of a root, suffix (quality) and bass
 */
export class Chord implements ChordProperties {
    bass: Key | null;
    root: Key | null;
    suffix: string | null;
    /**
     * Tries to parse a chord string into a chord
     * Any leading or trailing whitespace is removed first, so a chord like `  \n  E/G# \r ` is valid.
     * @param chordString the chord string, eg `Esus4/G#` or `1sus4/#3`.
     * @returns {Chord|null}
     */
    static parse(chordString: string): Chord | null;
    static parseOrFail(chordString: string): Chord;
    /**
     * Returns a deep copy of the chord
     * @returns {Chord}
     */
    clone(): Chord;
    /**
     * Converts the chord to a chord symbol, using the supplied key as a reference.
     * For example, a numeric chord `#4` with reference key `E` will return the chord symbol `A#`.
     * When the chord is already a chord symbol, it will return a clone of the object.
     * @param {Key|string|null} [referenceKey=null] the reference key. The key is required when converting a
     * numeric or numeral.
     * @returns {Chord} the chord symbol
     */
    toChordSymbol(referenceKey?: Key | string | null): Chord;
    /**
     * Converts the chord to a chord symbol string, using the supplied key as a reference.
     * For example, a numeric chord `#4` with reference key `E` will return the chord symbol `A#`.
     * When the chord is already a chord symbol, it will return a string version of the chord.
     * @param {Key|string|null} [referenceKey=null] the reference key. The key is required when converting a
     * numeric or numeral.
     * @returns {string} the chord symbol string
     * @see {toChordSymbol}
     */
    toChordSymbolString(referenceKey?: Key | string | null): string;
    /**
     * Determines whether the chord is a chord symbol
     * @returns {boolean}
     */
    isChordSymbol(): boolean;
    /**
     * Converts the chord to a chord solfege, using the supplied key as a reference.
     * For example, a numeric chord `#4` with reference key `Mi` will return the chord symbol `La#`.
     * When the chord is already a chord solfege, it will return a clone of the object.
     * @param {Key|string|null} [referenceKey=null] the reference key. The key is required when converting a
     * numeric or numeral.
     * @returns {Chord} the chord solfege
     */
    toChordSolfege(referenceKey?: Key | string | null): Chord;
    /**
     * Converts the chord to a chord solfege string, using the supplied key as a reference.
     * For example, a numeric chord `#4` with reference key `E` will return the chord solfege `A#`.
     * When the chord is already a chord solfege, it will return a string version of the chord.
     * @param {Key|string|null} [referenceKey=null] the reference key. The key is required when converting a
     * numeric or numeral.
     * @returns {string} the chord solfege string
     * @see {toChordSolfege}
     */
    toChordSolfegeString(referenceKey?: Key | string | null): string;
    /**
     * Determines whether the chord is a chord solfege
     * @returns {boolean}
     */
    isChordSolfege(): boolean;
    /**
     * Converts the chord to a numeric chord, using the supplied key as a reference.
     * For example, a chord symbol A# with reference key E will return the numeric chord #4.
     * @param {Key|string|null} [referenceKey=null] the reference key. The key is required when converting a chord symbol
     * @returns {Chord} the numeric chord
     */
    toNumeric(referenceKey?: Key | string | null): Chord;
    /**
     * Converts the chord to a numeral chord, using the supplied key as a reference.
     * For example, a chord symbol A# with reference key E will return the numeral chord #IV.
     * @param {Key|string|null} [referenceKey=null] the reference key. The key is required when converting a chord symbol
     * @returns {Chord} the numeral chord
     */
    toNumeral(referenceKey?: Key | string | null): Chord;
    /**
     * Converts the chord to a numeral chord string, using the supplied kye as a reference.
     * For example, a chord symbol A# with reference key E will return the numeral chord #4.
     * @param {Key|string|null} [referenceKey=null] the reference key. The key is required when converting a chord symbol
     * @returns {string} the numeral chord string
     * @see {toNumeral}
     */
    toNumeralString(referenceKey?: Key | string | null): string;
    /**
     * Determines whether the chord is numeric
     * @returns {boolean}
     */
    isNumeric(): boolean;
    /**
     * Converts the chord to a numeric chord string, using the supplied kye as a reference.
     * For example, a chord symbol A# with reference key E will return the numeric chord #4.
     * @param {Key|string|null} [referenceKey=null] the reference key. The key is required when converting a chord symbol
     * @returns {string} the numeric chord string
     * @see {toNumeric}
     */
    toNumericString(referenceKey?: Key | string | null): string;
    /**
     * Determines whether the chord is a numeral
     * @returns {boolean}
     */
    isNumeral(): boolean;
    /**
     * Converts the chord to a string, eg `Esus4/G#` or `1sus4/#3`
     * @param {Object} [configuration={}] options
     * @param {boolean} [configuration.useUnicodeModifier=false] Whether or not to use unicode modifiers.
     * This will make `#` (sharp) look like `♯` and `b` (flat) look like `♭`
     * @returns {string} the chord string
     */
    toString({ useUnicodeModifier }?: {
        useUnicodeModifier?: boolean | undefined;
    }): string;
    /**
     * Normalizes the chord root and bass notes:
     * - Fab becomes Mi
     * - Dob becomes Si
     * - Si# becomes Do
     * - Mi# becomes Fa
     * - Fb becomes E
     * - Cb becomes B
     * - B# becomes C
     * - E# becomes F
     * - 4b becomes 3
     * - 1b becomes 7
     * - 7# becomes 1
     * - 3# becomes 4
     *
     * Besides that it normalizes the suffix if `normalizeSuffix` is `true`.
     * For example, `sus2` becomes `2`, `sus4` becomes `sus`.
     * All suffix normalizations can be found in `src/normalize_mappings/suffix-mapping.txt`.
     *
     * When the chord is minor, bass notes are normalized off of the relative major
     * of the root note. For example, `Em/A#` becomes `Em/Bb`.
     * @param {Key|string} [key=null] the key to normalize to
     * @param {Object} [options={}] options
     * @param {boolean} [options.normalizeSuffix=true] whether to normalize the chord suffix after transposing
     * @returns {Chord} the normalized chord
     */
    normalize(key?: Key | string | null, { normalizeSuffix }?: {
        normalizeSuffix?: boolean;
    }): Chord;
    /**
     * Switches to the specified modifier
     * @param newModifier the modifier to use: `'#'` or `'b'`
     * @returns {Chord} the new, changed chord
     */
    useModifier(newModifier: Modifier): Chord;
    /**
     * Transposes the chord up by 1 semitone. Eg. A becomes A#, Eb becomes E
     * @returns {Chord} the new, transposed chord
     */
    transposeUp(): Chord;
    /**
     * Transposes the chord down by 1 semitone. Eg. A# becomes A, E becomes Eb
     * @returns {Chord} the new, transposed chord
     */
    transposeDown(): Chord;
    /**
     * Transposes the chord by the specified number of semitones
     * @param delta de number of semitones
     * @returns {Chord} the new, transposed chord
     */
    transpose(delta: number): Chord;
    constructor({ base, modifier, suffix, bassBase, bassModifier, root, bass, chordType, }: ChordConstructorOptions);
    equals(otherChord: Chord): boolean;
    static determineRoot({ root, base, modifier, suffix, chordType, }: {
        root: Key | null;
        base: string | number | null;
        modifier: Modifier | null;
        suffix: string | null;
        chordType: ChordType | null;
    }): Key | null;
    static determineBass({ bass, bassBase, bassModifier, chordType, }: {
        bass: Key | null;
        bassBase: string | number | null;
        bassModifier: Modifier | null;
        chordType: ChordType | null;
    }): Key | null;
    isMinor(): boolean;
    makeMinor(): Chord;
    set(properties: ChordProperties): Chord;
}
type Delegate = (_string: string) => string;
interface MetadataConfiguration {
    separator: string;
}
interface InstrumentConfiguration {
    type?: string;
    description?: string;
}
interface UserConfigurationProperties {
    name?: string;
    fullname?: string;
}
interface DelegatesConfiguration {
    abc: Delegate;
    ly: Delegate;
    tab: Delegate;
    grid: Delegate;
}
type Configuration = Record<string, any> & {
    decapo: boolean;
    delegates: Partial<Record<ContentType, Delegate>>;
    evaluate: boolean;
    expandChorusDirective: boolean;
    instrument: InstrumentConfiguration | null;
    key: Key | null;
    metadata: MetadataConfiguration;
    normalizeChords: boolean;
    useUnicodeModifiers: boolean;
    user: UserConfigurationProperties | null;
};
type ConfigurationProperties = Record<string, any> & Partial<{
    decapo: boolean;
    delegates: Partial<DelegatesConfiguration>;
    evaluate: boolean;
    expandChorusDirective: boolean;
    instrument: Partial<InstrumentConfiguration>;
    key: Key | string | null;
    metadata: Partial<MetadataConfiguration>;
    normalizeChords: boolean;
    useUnicodeModifiers: boolean;
    user: Partial<UserConfigurationProperties>;
}>;
/**
 * Base class for all formatters, taking care of receiving a configuration wrapping that inside a Configuration object
 */
export class Formatter {
    configuration: Configuration;
    /**
     * Instantiate
     * @param {Object} [configuration={}] options
     * @param {boolean} [configuration.evaluate=false] Whether or not to evaluate meta expressions.
     * For more info about meta expressions, see: https://bit.ly/2SC9c2u
     * @param {object} [configuration.metadata={}]
     * @param {string} [configuration.metadata.separator=", "] The separator to be used when rendering a
     * metadata value that has multiple values. See: https://bit.ly/2SC9c2u
     * @param {Key|string} [configuration.key=null] The key to use for rendering. The chord sheet will be
     * transposed from the song's original key (as indicated by the `{key}` directive) to the specified key.
     * Note that transposing will only work if the original song key is set.
     * @param {boolean} [configuration.expandChorusDirective=false] Whether or not to expand `{chorus}` directives
     * by rendering the last defined chorus inline after the directive.
     * @param {boolean} [configuration.useUnicodeModifiers=false] Whether or not to use unicode flat and sharp
     * symbols.
     * @param {boolean} [configuration.normalizeChords=true] Whether or not to automatically normalize chords
     */
    constructor(configuration?: ConfigurationProperties);
}
export class SoftLineBreak {
    clone(): SoftLineBreak;
}
type DefinitionSet = Record<string, ChordDefinition>;
declare class ChordDefinitionSet {
    definitions: DefinitionSet;
    constructor(definitions?: DefinitionSet);
    get(chord: string): ChordDefinition | null;
    withDefaults(): ChordDefinitionSet;
    add(chord: string, definition: ChordDefinition): void;
    has(chord: string): boolean;
    clone(): ChordDefinitionSet;
}
interface FormattingContext {
    configuration: Configuration;
    metadata: Metadata;
}
/**
 * Represents a paragraph of lines in a chord sheet
 */
export class Paragraph {
    /**
     * The {@link Line} items of which the paragraph consists
     * @member
     * @type {Line[]}
     */
    lines: Line[];
    addLine(line: any): void;
    /**
     * Indicates whether the paragraph only contains literals. If true, {@link contents} can be used to retrieve
     * the paragraph contents as one string where lines are separated by newlines.
     * @see {@link contents}
     * @returns {boolean}
     */
    isLiteral(): boolean;
    /**
     * Returns the paragraph contents as one string where lines are separated by newlines
     * @returns {string}
     */
    get contents(): string;
    /**
     * Returns the label of the paragraph. The label is the value of the first section delimiter tag
     * in the first line.
     * @returns {string|null}
     */
    get label(): string | null;
    /**
     * Tries to determine the common type for all lines. If the types for all lines are equal, it returns that type.
     * If not, it returns {@link INDETERMINATE}
     * For the possible values, see {@link Line.type}
     * @returns {string}
     */
    get type(): string;
    get selector(): string | null;
    /**
     * Indicates whether the paragraph contains lines with renderable items.
     * @see {@link Line.hasRenderableItems}
     * @returns {boolean}
     */
    hasRenderableItems(): boolean;
    isEmpty(): boolean;
}
/**
 * Represents a parser warning, currently only used by ChordProParser.
 */
declare class ParserWarning {
    /**
     * The warning message
     * @member
     * @type {string}
     */
    message: string;
    /**
     * The chord sheet line number on which the warning occurred
     * @member
     * @type {number}
     */
    lineNumber: number | null;
    /**
     * The chord sheet column on which the warning occurred
     * @member
     * @type {number}
     */
    column: number | null;
    /**
     * @hideconstructor
     */
    constructor(message: string, lineNumber: number | null, column: number | null);
    /**
     * Returns a stringified version of the warning
     * @returns {string} The string warning
     */
    toString(): string;
}
declare class FontStack {
    fontAndColourStacks: Record<string, string[]>;
    sizeStacks: Record<string, FontSize[]>;
    textFont: Font;
    chordFont: Font;
    applyTag(tag: Tag): void;
}
declare class SongBuilder {
    currentKey: string | null;
    currentLine: Line | null;
    fontStack: FontStack;
    lines: Line[];
    metadata: Metadata;
    sectionType: string;
    selector: string | null;
    song: Song;
    transposeKey: string | null;
    warnings: ParserWarning[];
    constructor(song: Song);
    get previousLine(): Line | null;
    addLine(line?: Line): Line;
    setCurrentProperties(sectionType: string, selector?: string | null): void;
    addItem(item: Item): void;
    chords(chr: string): void;
    lyrics(chr: string): void;
    addTag(tagContents: string | Tag): Tag;
    ensureLine(): void;
    setSectionTypeFromTag(tag: Tag): void;
    startSection(sectionType: string, tag: Tag): void;
    endSection(sectionType: string, tag: Tag): void;
    checkCurrentSectionType(sectionType: string, tag: Tag): void;
    addWarning(message: string, { line, column }: TraceInfo): void;
}
interface RenderChordOptions {
    renderKey?: Key | null;
    useUnicodeModifier?: boolean;
    normalizeChords?: boolean;
    decapo?: boolean;
}
/**
 * Renders a chord in the context of a line and song and taking into account some options
 * @param chordString The chord to render
 * @param line The line the chord is in
 * @param song The song the line is in
 * @param renderKey The key to render the chord in. If not provided, the line key will be used,
 * or the song key if the line key is not provided.
 * @param useUnicodeModifier Whether to use unicode modifiers ('\u266f'/'\u266d') or plain text ('#'/'b').
 * Default `false`.
 * @param normalizeChords Whether to normalize the chord to the key (default `true`)
 * @param decapo Whether to transpose all chords to eliminate the capo (default `false`)
 */
declare function renderChord(chordString: string, line: Line, song: Song, { renderKey, useUnicodeModifier, normalizeChords, decapo, }?: RenderChordOptions): string;
type MapItemsCallback = (_item: Item) => Item | Item[] | null;
/**
 * Represents a song in a chord sheet. Currently a chord sheet can only have one song.
 */
export class Song extends MetadataAccessors {
    /**
     * The {@link Line} items of which the song consists
     * @member {Line[]}
     */
    lines: Line[];
    _bodyLines: Line[] | null;
    _bodyParagraphs: Paragraph[] | null;
    warnings: ParserWarning[];
    _metadata: Metadata | null;
    /**
     * Creates a new {Song} instance
     * @param metadata {Record<string, string | string[]>|Metadata} predefined metadata
     */
    constructor(metadata?: Record<string, string | string[]> | Metadata | null);
    /**
     * Returns the song lines, skipping the leading empty lines (empty as in not rendering any content). This is useful
     * if you want to skip the "header lines": the lines that only contain meta data.
     * @returns {Line[]} The song body lines
     */
    get bodyLines(): Line[];
    /**
     * Returns the song paragraphs, skipping the paragraphs that only contain empty lines
     * (empty as in not rendering any content)
     * @see {@link bodyLines}
     * @returns {Paragraph[]}
     */
    get bodyParagraphs(): Paragraph[];
    selectRenderableItems(items: (Line | Paragraph)[]): (Line | Paragraph)[];
    /**
     * The {@link Paragraph} items of which the song consists
     * @member {Paragraph[]}
     */
    get paragraphs(): Paragraph[];
    /**
     * The body paragraphs of the song, with any `{chorus}` tag expanded into the targeted chorus
     * @type {Paragraph[]}
     */
    get expandedBodyParagraphs(): Paragraph[];
    linesToParagraphs(lines: Line[]): Paragraph[];
    /**
     * Returns a deep clone of the song
     * @returns {Song} The cloned song
     */
    clone(): Song;
    getMetadataValue(name: string): string | string[] | null;
    getSingleMetadataValue(name: string): string | null;
    /**
     * Returns a copy of the song with the key value set to the specified key. It changes:
     * - the value for `key` in the {@link metadata} set
     * - any existing `key` directive
     * @param {number|null} key the key. Passing `null` will:
     * - remove the current key from {@link metadata}
     * - remove any `key` directive
     * @returns {Song} The changed song
     */
    setKey(key: string | number | null): Song;
    /**
     * Returns a copy of the song with the key value set to the specified capo. It changes:
     * - the value for `capo` in the {@link metadata} set
     * - any existing `capo` directive
     * @param {number|null} capo the capo. Passing `null` will:
     * - remove the current key from {@link metadata}
     * - remove any `capo` directive
     * @returns {Song} The changed song
     */
    setCapo(capo: number | null): Song;
    /**
     * Transposes the song by the specified delta. It will:
     * - transpose all chords, see: {@link Chord#transpose}
     * - transpose the song key in {@link metadata}
     * - update any existing `key` directive
     * @param {number} delta The number of semitones (positive or negative) to transpose with
     * @param {Object} [options={}] options
     * @param {boolean} [options.normalizeChordSuffix=false] whether to normalize the chord suffixes after transposing
     * @returns {Song} The transposed song
     */
    transpose(delta: number, { modifier, normalizeChordSuffix }?: {
        modifier?: Modifier | null;
        normalizeChordSuffix?: boolean;
    }): Song;
    /**
     * Transposes the song up by one semitone. It will:
     * - transpose all chords, see: {@link Chord#transpose}
     * - transpose the song key in {@link metadata}
     * - update any existing `key` directive
     * @param {Object} [options={}] options
     * @param {boolean} [options.normalizeChordSuffix=false] whether to normalize the chord suffixes after transposing
     * @returns {Song} The transposed song
     */
    transposeUp({ normalizeChordSuffix }?: {
        normalizeChordSuffix?: boolean;
    }): Song;
    /**
     * Transposes the song down by one semitone. It will:
     * - transpose all chords, see: {@link Chord#transpose}
     * - transpose the song key in {@link metadata}
     * - update any existing `key` directive
     * @param {Object} [options={}] options
     * @param {boolean} [options.normalizeChordSuffix=false] whether to normalize the chord suffixes after transposing
     * @returns {Song} The transposed song
     */
    transposeDown({ normalizeChordSuffix }?: {
        normalizeChordSuffix?: boolean;
    }): Song;
    /**
     * Returns a copy of the song with the key set to the specified key. It changes:
     * - the value for `key` in the {@link metadata} set
     * - any existing `key` directive
     * - all chords, those are transposed according to the distance between the current and the new key
     * @param {string} newKey The new key.
     * @returns {Song} The changed song
     */
    changeKey(newKey: string | Key): Song;
    /**
     * Returns a copy of the song with all chords changed to the specified modifier.
     *
     * Examples:
     *
     * ```js
     * song.useModifier('#');
     * song.useModifier('b');
     * ```
     *
     * @param {Modifier} modifier the new modifier
     * @returns {Song} the changed song
     */
    useModifier(modifier: Modifier): Song;
    /**
     * Returns a copy of the song with all chords normalized to the specified key. See {@link Chord#normalize}.
     * @param key the key to normalize to
     * @param options options
     * @param options.normalizeSuffix whether to normalize the chord suffixes
     */
    normalizeChords(key?: Key | string | null, { normalizeSuffix }?: {
        normalizeSuffix?: boolean;
    }): Song;
    mapChordLyricsPairs(func: (pair: ChordLyricsPair) => ChordLyricsPair): Song;
    changeChords(func: (chord: Chord) => Chord): Song;
    get currentKey(): Key | null;
    requireCurrentKey(): Key;
    /**
     * Returns a copy of the song with the directive value set to the specified value.
     * - when there is a matching directive in the song, it will update the directive
     * - when there is no matching directive, it will be inserted
     * If `value` is `null` it will act as a delete, any directive matching `name` will be removed.
     *
     * @example
     * ```javascript
     * song.changeMetadata('author', 'John');
     * song.changeMetadata('composer', ['Jane', 'John']);
     * song.changeMetadata('key', null); // Remove key directive
     * ```
     * @param name The directive name
     * @param {string | string[] | null} value The value to set, or `null` to remove the directive
     * @return {Song} The changed song
     */
    changeMetadata(name: string, value: string | string[] | null): Song;
    /**
     * Returns a copy of the song with the metadata changed. It will:
     * - update the metadata
     * - update any existing directive matching the metadata key
     * - insert a new directive if it does not exist
     * @example
     * ```javascript
     * song.changeMetadata({
     *   author: 'John',
     *   composer: ['Jane', 'John'],
     *   key: null, // Remove key directive
     * });
     * ```
     * @param {Record<string, string | string[] | null>} metadata The metadata to change
     * @returns {Song} The changed song
     */
    changeMetadata(metadata: Record<string, string | string[] | null>): Song;
    addLine(line: Line): void;
    /**
     * Change the song contents inline. Return a new {@link Item} to replace it. Return `null` to remove it.
     * @example
     * // transpose all chords:
     * song.mapItems((item) => {
     *   if (item instanceof ChordLyricsPair) {
     *     return item.transpose(2, 'D');
     *   }
     *
     *   return item;
     * });
     * @param {MapItemsCallback} func the callback function
     * @returns {Song} the changed song
     */
    mapItems(func: MapItemsCallback): Song;
    foreachItem(func: (_item: Item) => void): void;
    /**
     * Returns all unique chords used in the song
     * @returns {string[]} the chords
     */
    getChords(): string[];
    /**
     * Returns all chord definitions from the song.
     * Definitions are made using the `{chord}` or `{define}` directive.
     * A chord definitions overrides a previous chord definition for the exact same chord.
     * @returns {Record<string, ChordDefinition>} the chord definitions
     * @see https://chordpro.org/chordpro/directives-define/
     * @see https://chordpro.org/chordpro/directives-chord/
     */
    getChordDefinitions(context?: FormattingContext): Record<string, ChordDefinition>;
    /**
     * The song's metadata. When there is only one value for an entry, the value is a string. Else, the value is
     * an array containing all unique values for the entry.
     * @type {Metadata}
     */
    get metadata(): Metadata;
    getMetadata(configuration?: Configuration): Metadata;
    get chordDefinitions(): ChordDefinitionSet;
    /**
     * Change the song contents inline. Return a new {@link Line} to replace it. Return `null` to remove it.
     * @example
     * // remove lines with only Tags:
     * song.mapLines((line) => {
     *   if (line.items.every(item => item instanceof Tag)) {
     *     return null;
     *   }
     *
     *   return line;
     * });
     * @param {MapLinesCallback} func the callback function
     * @returns {Song} the changed song
     */
    mapLines(func: (_line: Line) => Line | null): Song;
}
/**
 * Formats a song into a ChordPro chord sheet
 */
export class ChordProFormatter extends Formatter {
    /**
     * Formats a song into a ChordPro chord sheet.
     * @param {Song} song The song to be formatted
     * @returns {string} The ChordPro string
     */
    format(song: Song): string;
    formatLine(line: Line, metadata: Metadata): string;
    formatItem(item: Item, metadata: Metadata): string;
    formatOrEvaluateItem(item: Evaluatable, metadata: Metadata): string;
    formatTernary(ternary: Ternary): string;
    formatValueTest(valueTest: string | null): string;
    formatExpressionRange(expressionRange: Evaluatable[]): string;
    formatExpression(expression: Evaluatable): string;
    formatTag(tag: Tag): string;
    formatTagAttributes(tag: Tag): string;
    formatChordLyricsPair(chordLyricsPair: ChordLyricsPair): string;
    formatChordLyricsPairChords(chordLyricsPair: ChordLyricsPair): string;
    formatChordLyricsPairLyrics(chordLyricsPair: ChordLyricsPair): string;
    formatComment(comment: Comment): string;
}
type AstType = ChordLyricsPair | Comment | Tag | Ternary | Evaluatable | Literal | SoftLineBreak;
/**
 * Serializes a song into een plain object, and deserializes the serialized object back into a {@link Song}
 */
export class ChordSheetSerializer {
    song: Song;
    songBuilder: SongBuilder;
    /**
     * Serializes the chord sheet to a plain object, which can be converted to any format like JSON, XML etc
     * Can be deserialized using {@link deserialize}
     * @returns object A plain JS object containing all chord sheet data
     */
    serialize(song: Song): SerializedSong;
    serializeLine(line: Line): SerializedLine;
    serializeItem(item: AstType): SerializedComponent;
    serializeChordDefinition(chordDefinition: ChordDefinition): SerializedChordDefinition;
    serializeTag(tag: Tag): SerializedTag;
    serializeChordLyricsPair(chordLyricsPair: ChordLyricsPair): SerializedChordLyricsPair;
    serializeTernary(ternary: Ternary): object;
    serializeLiteral(literal: Literal): string;
    serializeExpression(expression: AstType[]): SerializedComponent[];
    serializeComment(comment: Comment): SerializedComment;
    /**
     * Deserializes a song that has been serialized using {@link serialize}
     * @param {object} serializedSong The serialized song
     * @returns {Song} The deserialized song
     */
    deserialize(serializedSong: SerializedSong): Song;
    parseAstComponent(astComponent: SerializedComponent): null | ChordLyricsPair | Tag | Comment | Ternary | Literal | SoftLineBreak;
    parseChordSheet(astComponent: SerializedSong): void;
    parseLine(astComponent: SerializedLine): void;
    parseChordLyricsPair(astComponent: SerializedChordLyricsPair): ChordLyricsPair;
    parseTag(astComponent: SerializedTag): Tag;
    parseComment(astComponent: SerializedComment): Comment;
    parseTernary(astComponent: SerializedTernary): Ternary;
    parseExpression(expression: (SerializedLiteral | SerializedTernary)[]): (AstType | null)[];
}
interface ParseOptions {
    filename?: string;
    startRule?: string;
    tracer?: any;
    [key: string]: any;
}
type ChordProParserOptions = ParseOptions & {
    softLineBreaks?: boolean;
    chopFirstWord?: boolean;
};
/**
 * Parses a ChordPro chord sheet
 */
export class ChordProParser {
    song?: Song;
    /**
     * All warnings raised during parsing the chord sheet
     * @member
     * @type {ParserWarning[]}
     */
    get warnings(): ParserWarning[];
    /**
     * Parses a ChordPro chord sheet into a song
     * @param {string} chordSheet the ChordPro chord sheet
     * @param {ChordProParserOptions} options Parser options.
     * @param {ChordProParserOptions.softLineBreaks} options.softLineBreaks=false If true, a backslash
     * followed by * a space is treated as a soft line break
     * @param {ChordProParserOptions.chopFirstWord} options.chopFirstWord=true If true, only the first lyric
     * word is paired with the chord, the rest of the lyric is put in a separate chord lyric pair
     * @see https://peggyjs.org/documentation.html#using-the-parser
     * @returns {Song} The parsed song
     */
    parse(chordSheet: string, options?: ChordProParserOptions): Song;
}
/**
 * Parses a normal chord sheet
 *
 * ChordSheetParser is deprecated, please use ChordsOverWordsParser.
 *
 * ChordsOverWordsParser aims to support any kind of chord, whereas ChordSheetParser lacks
 * support for many variations. Besides that, some chordpro feature have been ported back
 * to ChordsOverWordsParser, which adds some interesting functionality.
 */
export class ChordSheetParser {
    processingText: boolean;
    preserveWhitespace: boolean;
    song: Song;
    songBuilder: SongBuilder;
    songLine: Line | null;
    chordLyricsPair: ChordLyricsPair | null;
    lines: string[];
    currentLine: number;
    lineCount: number;
    /**
     * Instantiate a chord sheet parser
     * ChordSheetParser is deprecated, please use ChordsOverWordsParser.
     * @param {Object} [options={}] options
     * @param {boolean} [options.preserveWhitespace=true] whether to preserve trailing whitespace for chords
     * @deprecated
     */
    constructor({ preserveWhitespace }?: {
        preserveWhitespace?: boolean;
    }, showDeprecationWarning?: boolean);
    /**
     * Parses a chord sheet into a song
     * @param {string} chordSheet The ChordPro chord sheet
     * @param {Object} [options={}] Optional parser options
     * @param {Song} [options.song=null] The {@link Song} to store the song data in
     * @returns {Song} The parsed song
     */
    parse(chordSheet: string, { song }?: {
        song?: Song;
    }): Song;
    endOfSong(): void;
    parseLine(line: any): void;
    parseNonEmptyLine(line: any): void;
    initialize(document: any, song?: Song | null): void;
    readLine(): string;
    hasNextLine(): boolean;
    parseLyricsWithChords(chordsLine: any, lyricsLine: any): void;
    processCharacters(chordsLine: any, lyricsLine: any): void;
    addCharacter(chr: any, nextChar: any): void;
    shouldAddCharacterToChords(nextChar: any): any;
    ensureChordLyricsPairInitialized(): void;
}
type WhenCallback = () => string;
declare class WhenClause {
    condition: boolean;
    callback: WhenCallback;
    constructor(condition: any, callback: WhenCallback);
    evaluate(otherClauses: WhenClause[]): string;
}
declare class When {
    condition: boolean;
    clauses: WhenClause[];
    constructor(condition: any, thenCallback?: WhenCallback);
    then(thenCallback: WhenCallback): When;
    elseWhen(condition: any, callback?: WhenCallback): When;
    else(callback: WhenCallback): When;
    toString(): string;
}
interface HtmlTemplateCssClasses {
    annotation: string;
    chord: string;
    chordSheet: string;
    column: string;
    comment: string;
    emptyLine: string;
    label: string;
    labelWrapper: string;
    line: string;
    literal: string;
    literalContents: string;
    lyrics: string;
    paragraph: string;
    row: string;
    subtitle: string;
    title: string;
}
interface HtmlTemplateArgs {
    configuration: Configuration;
    song: Song;
    renderBlankLines?: boolean;
    bodyParagraphs: Paragraph[];
    cssClasses: HtmlTemplateCssClasses;
}
type Template = (_args: HtmlTemplateArgs) => string;
type CSS = Record<string, Record<string, string>>;
/**
 * Acts as a base class for HTML formatters
 */
export abstract class HtmlFormatter extends Formatter {
    cssClasses: HtmlTemplateCssClasses;
    /**
     * Instantiate the formatter. For all options see {@link Formatter}
     * @param {Object} [configuration={}] options
     * @param {object} [configuration.cssClasses={}] CSS classes to use in the HTML output. The default classes are
     * defined in {@link defaultCssClasses}. You can override them by providing your own classes here:
     * @example
     * ```javascript
     * {
     *    cssClasses: {
     *      annotation: 'my-annotation',
     *      chord: 'my-chord',
     *      chordSheet: 'my-chord-sheet',
     *      column: 'my-column',
     *      comment: 'my-comment',
     *      emptyLine: 'my-empty-line',
     *      label: 'my-label',
     *      labelWrapper: 'my-label-wrapper',
     *      line: 'my-line',
     *      literal: 'my-literal',
     *      literalContents: 'my-contents',
     *      lyrics: 'my-lyrics',
     *      paragraph: 'my-paragraph',
     *      row: 'my-row',
     *      subtitle: 'my-subtitle',
     *      title: 'my-title',
     *    }
     *  }
     *  ```
     */
    constructor(configuration?: ConfigurationProperties & {
        cssClasses?: Partial<HtmlTemplateCssClasses>;
    });
    /**
     * Formats a song into HTML.
     * @param {Song} song The song to be formatted
     * @returns {string} The HTML string
     */
    format(song: Song): string;
    /**
     * Generates basic CSS, optionally scoped within the provided selector, to use with the HTML output
     *
     * For example, execute cssString('.chordSheetViewer') will result in CSS like:
     *
     *     .chordSheetViewer .paragraph {
     *       margin-bottom: 1em;
     *     }
     *
     * @param scope the CSS scope to use, for example `.chordSheetViewer`
     * @returns {string} the CSS string
     */
    cssString(scope?: string): string;
    /**
     * Basic CSS, in object style à la useStyles, to use with the HTML output
     * For a CSS string see {@link cssString}
     *
     * Example:
     *
     *     '.paragraph': {
     *       marginBottom: '1em'
     *     }
     *
     * @return {Object.<string, Object.<string, string>>} the CSS object
     */
    get cssObject(): CSS;
    abstract get defaultCss(): CSS;
    abstract get template(): Template;
}
type EachCallback = (_item: any) => string;
declare function isChordLyricsPair(item: Item): boolean;
declare function lineHasContents(line: Line): boolean;
declare function isTag(item: Item): boolean;
declare function isComment(item: Tag): boolean;
declare function stripHTML(string: string): string;
declare function each(collection: any[], callback: EachCallback): string;
declare function when(condition: any, callback?: WhenCallback): When;
declare function hasTextContents(line: Line): boolean;
declare function lineClasses(line: Line, cssClasses: HtmlTemplateCssClasses): string;
declare function paragraphClasses(paragraph: Paragraph, cssClasses: HtmlTemplateCssClasses): string;
declare function evaluate(item: Evaluatable, metadata: Metadata, configuration: Configuration): string;
declare function fontStyleTag(font: Font): string;
export const templateHelpers: {
    isEvaluatable: typeof isEvaluatable;
    isChordLyricsPair: typeof isChordLyricsPair;
    lineHasContents: typeof lineHasContents;
    isTag: typeof isTag;
    isComment: typeof isComment;
    stripHTML: typeof stripHTML;
    each: typeof each;
    when: typeof when;
    hasTextContents: typeof hasTextContents;
    lineClasses: typeof lineClasses;
    paragraphClasses: typeof paragraphClasses;
    evaluate: typeof evaluate;
    fontStyleTag: typeof fontStyleTag;
    renderChord: typeof renderChord;
    hasChordContents: typeof hasChordContents;
};
/**
 * Formats a song into a plain text chord sheet
 */
export class ChordsOverWordsFormatter extends Formatter {
    song: Song;
    /**
     * Formats a song into a plain text chord sheet
     * @param {Song} song The song to be formatted
     * @returns {string} the chord sheet
     */
    format(song: Song): string;
    formatHeader(): string;
    formatParagraphs(): string;
    formatParagraph(paragraph: Paragraph, metadata: Metadata): string;
    formatLine(line: Line, metadata: Metadata): string;
    formatLineTop(line: Line, metadata: Metadata): string | null;
    chordLyricsPairLength(chordLyricsPair: ChordLyricsPair, line: Line): number;
    formatItemTop(item: Item, _metadata: Metadata, line: Line): string;
    renderChord(item: ChordLyricsPair, line: Line): string;
    formatLineBottom(line: any, metadata: any): string | null;
    formatLineWithFormatter(line: Line, formatter: (_item: Item, _metadata: Metadata, _line: Line) => string, metadata: Metadata): string;
    formatItemBottom(item: Item, metadata: Metadata, line: Line): string;
}
interface _ParseOptions1 {
    filename?: string;
    startRule?: string;
    tracer?: any;
    [key: string]: any;
}
type ChordsOverWordsParserOptions = _ParseOptions1 & {
    softLineBreaks?: boolean;
    chopFirstWord?: boolean;
};
/**
 * Parses a chords over words sheet into a song
 *
 * It support "regular" chord sheets:
 *
 *            Am         C/G        F          C
 *     Let it be, let it be, let it be, let it be
 *     C                G              F  C/E Dm C
 *     Whisper words of wisdom, let it be
 *
 * Additionally, some chordpro features have been "ported back". For example, you can use chordpro directives:
 *
 *     {title: Let it be}
 *     {key: C}
 *     Chorus 1:
 *            Am
 *     Let it be
 *
 * For convenience, you can leave out the brackets:
 *
 *     title: Let it be
 *     Chorus 1:
 *            Am
 *     Let it be
 *
 * You can even use a markdown style frontmatter separator to separate the header from the song:
 *
 *     title: Let it be
 *     key: C
 *     ---
 *     Chorus 1:
 *            Am         C/G        F          C
 *     Let it be, let it be, let it be, let it be
 *     C                G              F  C/E Dm C
 *     Whisper words of wisdom, let it be
 *
 * `ChordsOverWordsParser` is the better version of `ChordSheetParser`, which is deprecated.
 */
export class ChordsOverWordsParser {
    song?: Song;
    /**
     * All warnings raised during parsing the chord sheet
     * @member
     * @type {ParserWarning[]}
     */
    get warnings(): ParserWarning[];
    /**
     * Parses a chords over words sheet into a song
     * @param {string} chordSheet the chords over words sheet
     * @param {ChordsOverWordsParserOptions} options Parser options.
     * @param {ChordsOverWordsParserOptions.softLineBreaks} options.softLineBreaks=false If true, a backslash
     * followed by a space is treated as a soft line break
     * @param {ChordsOverWordsParserOptions.chopFirstWord} options.chopFirstWord=true If true, only the first lyric
     * word is paired with the chord, the rest of the lyric is put in a separate chord lyric pair
     * @see https://peggyjs.org/documentation.html#using-the-parser
     * @returns {Song} The parsed song
     */
    parse(chordSheet: string, options?: ChordsOverWordsParserOptions): Song;
}
/**
 * Formats a song into HTML. It uses DIVs to align lyrics with chords, which makes it useful for responsive web pages.
 */
export class HtmlDivFormatter extends HtmlFormatter {
    get template(): Template;
    get defaultCss(): CSS;
}
/**
 * Formats a song into HTML. It uses TABLEs to align lyrics with chords, which makes the HTML for things like
 * PDF conversion.
 */
export class HtmlTableFormatter extends HtmlFormatter {
    get template(): Template;
    get defaultCss(): CSS;
}
/**
 * Formats a song into a plain text chord sheet
 */
export class TextFormatter extends Formatter {
    song: Song;
    /**
     * Formats a song into a plain text chord sheet
     * @param {Song} song The song to be formatted
     * @returns {string} the chord sheet
     */
    format(song: Song): string;
    formatHeader(): string;
    formatParagraphs(): string;
    formatParagraph(paragraph: Paragraph, metadata: Metadata): string;
    formatLine(line: Line, metadata: Metadata): string;
    formatTitle(title: string | null): string;
    formatSubTitle(subtitle: string | null): string;
    formatLineTop(line: Line, metadata: Metadata): string | null;
    chordLyricsPairLength(chordLyricsPair: ChordLyricsPair, line: Line): number;
    formatItemTop(item: Item, _metadata: Metadata, line: Line): string;
    formatLineBottom(line: Line, metadata: Metadata): string;
    formatLineWithFormatter(line: Line, formatter: (_item: Item, _metadata: Metadata, _line: Line) => string, metadata: Metadata): string;
    formatItemBottom(item: Item, metadata: Metadata, line: Line): string;
}
/**
 * Parses an Ultimate Guitar chord sheet with metadata
 * Inherits from {@link ChordSheetParser}
 */
export class UltimateGuitarParser extends ChordSheetParser {
    currentSectionType: string | null;
    /**
     * Instantiate a chord sheet parser
     * @param {Object} [options={}] options
     * @param {boolean} [options.preserveWhitespace=true] whether to preserve trailing whitespace for chords
     */
    constructor({ preserveWhitespace }?: {
        preserveWhitespace?: boolean;
    });
    parseLine(line: string): void;
    parseVerseDirective(line: string): boolean;
    parseChorusDirective(line: string): boolean;
    parseMetadata(line: string): boolean;
    isSectionEnd(): boolean;
    endOfSong(): void;
    startSection(sectionType: 'verse' | 'chorus', label: string): void;
    endSection({ addNewLine }?: {
        addNewLine?: boolean | undefined;
    }): void;
    startNewLine(): void;
}
export const version: "12.3.1";
declare const _default: {
    CHORUS: string;
    Chord: typeof Chord;
    ChordDefinition: typeof ChordDefinition;
    ChordLyricsPair: typeof ChordLyricsPair;
    ChordProFormatter: typeof ChordProFormatter;
    ChordProParser: typeof ChordProParser;
    ChordSheetParser: typeof ChordSheetParser;
    ChordSheetSerializer: typeof ChordSheetSerializer;
    ChordsOverWordsFormatter: typeof ChordsOverWordsFormatter;
    ChordsOverWordsParser: typeof ChordsOverWordsParser;
    Comment: typeof Comment;
    Composite: typeof Composite;
    HtmlDivFormatter: typeof HtmlDivFormatter;
    HtmlTableFormatter: typeof HtmlTableFormatter;
    INDETERMINATE: string;
    Line: typeof Line;
    Literal: typeof Literal;
    Metadata: typeof Metadata;
    NONE: string;
    Paragraph: typeof Paragraph;
    PART: string;
    SoftLineBreak: typeof SoftLineBreak;
    Song: typeof Song;
    TAB: string;
    Tag: typeof Tag;
    Ternary: typeof Ternary;
    TextFormatter: typeof TextFormatter;
    UltimateGuitarParser: typeof UltimateGuitarParser;
    VERSE: string;
    version: string;
    templateHelpers: {
        isEvaluatable: typeof isEvaluatable;
        isChordLyricsPair: typeof isChordLyricsPair;
        lineHasContents: typeof lineHasContents;
        isTag: typeof isTag;
        isComment: typeof isComment;
        stripHTML: typeof stripHTML;
        each: typeof each;
        when: typeof when;
        hasTextContents: typeof hasTextContents;
        lineClasses: typeof lineClasses;
        paragraphClasses: typeof paragraphClasses;
        evaluate: typeof evaluate;
        fontStyleTag: typeof fontStyleTag;
        renderChord: typeof renderChord;
        hasChordContents: typeof hasChordContents;
    };
};
export default _default;

//# sourceMappingURL=main.d.ts.map
