const xRegExp = require("xregexp");

class TokenRegex {
  constructor(name, regexLiteral, flags) {
    this.name = name;
    this.expression = xRegExp(regexLiteral, flags);
  }

  get lastIndex() {
    return this.expression.lastIndex;
  }

  set lastIndex(index) {
    this.expression.lastIndex = index;
  }

  reset() {
    this.lastIndex = 0;

    return this;
  }

  exec(program) {
    let match = this.expression.exec(program);

    if (match !== null) {
      return {
        type: this.name,
        value: match[1],
        start: this.lastIndex - match[1].length + 1,
        end: this.lastIndex
      };
    }

    return null;
  }

  test(program) {
    let savedIndex = this.lastIndex;
    const result = this.exec(program);
    this.lastIndex = savedIndex;

    return result !== null;
  }
}

const WHITES = new TokenRegex(
  "WHITE",
  `(\\s+|       # Spaces
                                [#;].*|     # Single-line comments
                                \\/\\*[^]*?\\*\\/  # Multiline comments
                               )`,
  `yx`
);

const NEWLINE = new TokenRegex(
  "NEWLINE",
  `(\\r?        # Carriage return (for compatibility)
                                 \\n         # Newline char
                                )`
);

const NUMBER = new TokenRegex(
  "NUMBER",
  `([-+]?       # Sign
                                \\d*          # Digits
                                \\.?\\d+      # Decimals
                                (?:[eE][-+]?\\d+)? # Exp notatio
                               )`,
  "yx"
);

const STRING = new TokenRegex(
  "STRING",
  `"([^"\\\\]*  # Any character except 'escaped "'
                                )"`,
  "yx"
);

const WORD = new TokenRegex(
  "WORD",
  `(\\[\\]|     # [] is a reserved word for arrays
                              :=|         # := is a reserved word for 'define'
                              [^\\s\\(\\)\\{\\}\\[\\]\\.,:"]+   # Avoid some chars
                              )`,
  "yx"
);

const LP = new TokenRegex(
  "LP",
  `([\\(\\{\\[\\.]  # ({[ are synonyms
                           )`,
  "yx"
);

const RP = new TokenRegex(
  "RP",
  `([\\)\\}\\]]     # }}] are synonyms
                          )`,
  "yx"
);

const COMMA = new TokenRegex(
  "COMMA",
  `(,|          # comma
                               :(?!=)      # a : that isn't followed by a = (:= is word)
                              )`,
  "yx"
);

const REGEX = new TokenRegex(
  "REGEX",
  `(r/[^]*?/       # body of the regex
                               [nsxAgimuy]*   # flags
                              )`,
  "yx"
);

module.exports = {
  WHITES,
  NEWLINE,
  NUMBER,
  STRING,
  WORD,
  LP,
  RP,
  COMMA,
  REGEX,
  TokenRegex
};
