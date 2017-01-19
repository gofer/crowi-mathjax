/* MathJax Formula
 *
 * markdown: $$ y = f(x) $$
 *   -> [ preprocess ] -> 
 * markdown: <pre class="mathjax-formula">`$$ y = f(x) $$`</pre>
 *   -> [ markdown parser (marked) ] -> 
 * html: <pre class="mathjax-formula"><code>$$ y = f(x) $$</code></pre>
 *   -> [ postprocess ] -> 
 * html: $$ y = f(x) $$
 */

export default class MathJaxFormula {

  constructor() {
    this.block_open_tag   = '<div class="mathjax-formula-block">';
    this.block_close_tag  = '</div>';
    this.inline_open_tag  = '<span class="mathjax-formula-inline">';
    this.inline_close_tag = '</span>';

    this.get_tag_name = function(open_tag) {
      return open_tag.replace(/^<(.*)>$/, '$1').split(' ')[0];
    };

    this.get_class_name = function(tag) {
      return tag.replace(/^<(.*)>$/, '$1')
             .split(' ')
             .map( function(v) { return v.split('='); } )
             .reduce(
               function(p,v) { return (v[0] == 'class') ? v[1] : p; }, 
               null
             );
    };

    this.block_tag_name  = this.get_tag_name(this.block_open_tag);
    this.inline_tag_name = this.get_tag_name(this.inline_open_tag);
    this.block_class_name  = this.get_class_name(this.block_open_tag);
    this.inline_class_name = this.get_class_name(this.inline_open_tag);
  }

  process(markdown) {
    String.prototype.insert = function(i, s) {
      return this.slice(0, i) + s + this.slice(i);
    };

    var pos = 0;
    var flag_in_code = false;
    var code_quote_num = 0;
    var flag_in_formula = false;
    var flag_block_formula = false;

    var not_escaped = function() {
      return !(pos > 0 && markdown[pos - 1] == '\\');
    };
 
    var double_dollar = function() {
      return pos + 1 < markdown.length && markdown[pos + 1] == '$';
    };

    var set_code_flag = function(quote_num) { 
      flag_in_code   = true;
      code_quote_num = quote_num;
    };

    var unset_code_flag = function() {
      flag_in_code   = false;
      code_quote_num = 0;
    };

    var set_formula_flag = function(block) {
      flag_in_formula    = true;
      flag_block_formula = block;
    };

    var unset_formula_flag = function() {
      flag_in_formula    = false;
      flag_block_formula = false;
    };

    var count_code_quote = function() {
      var p = pos;
      while (p < markdown.length && markdown[p] == '`') {
        p += 1;
      }
      return p - pos;
    }

    var has_expected_code_quote = function(expect) {
      var p = pos;
      for (var i = 0; p < markdown.length && i < expect; i += 1) {
        if (markdown[p] != '`') {
          break;
        }
        p += 1;
      }
      return (p - pos) == expect;
    }

    var last_pos = -1;
 
    while (pos < markdown.length) {
      if (markdown[pos] == '`' && not_escaped()) {
        if (flag_in_code && has_expected_code_quote(code_quote_num)) { // コード内
            pos += code_quote_num;

            unset_code_flag();
        } else {
          var num_of_quote = count_code_quote();
          pos += num_of_quote;

          set_code_flag(num_of_quote);
        }
      } else if (markdown[pos] == '$' && not_escaped() && (!flag_in_code)) {
        if (flag_in_formula) { // 数式モード内
          if (flag_block_formula && double_dollar()) {
            markdown = markdown.insert(pos + 2, '`' + this.block_close_tag);
            pos += this.block_close_tag.length + 2;

            unset_formula_flag(); 
          } else if ((!flag_block_formula) && (!double_dollar())) {
            markdown = markdown.insert(pos + 1, '`' + this.inline_close_tag);
            pos += this.inline_close_tag.length + 1;

            unset_formula_flag();
          }
        } else {
          if (double_dollar()) {
            markdown = markdown.insert(pos, this.block_open_tag + '`');
            pos += this.block_open_tag.length + 2;

            set_formula_flag(true);
          } else {
            markdown = markdown.insert(pos, this.inline_open_tag + '`');
            pos += this.inline_open_tag.length + 1;

            set_formula_flag(false);
          }

          last_pos = pos;
        }
      }

      pos += 1;
    }

    // for invalid tex formula
    if (flag_in_formula) {
      if (flag_block_formula) {
        markdown = markdown.insert(last_pos + this.block_open_tag.length  + 2, '$$`' + this.block_close_tag);
      } else {
        markdown = markdown.insert(last_pos + this.inline_open_tag.length + 1, '$`'  + this.inline_close_tag);
      }
    }

    return markdown;
  }

  postprocess(html)
  {
    String.prototype.remove = function(p, q) {
      if(p > q) return '';
      return this.slice(0, p) + this.slice(q + 1);
    };

    var stack = [];
    var pos = 0;

    var get_tag = function() {
      var p = 0;
      for (p = pos + 1; p < html.length; p += 1) {
        if (html[p] == '>') {
          break;
        }
      }
      return html.slice(pos, p + 1);
    };

    while (pos < html.length) {
      if (html[pos] == '<') {
        var tag = get_tag();
        var tag_name = this.get_tag_name(tag);
        
        if (tag_name.startsWith('/')) { // 閉じタグ
          var open_tag = stack[stack.length - 1];
          if ('/' + open_tag.TagName == tag_name) { // 正しい閉じタグ
            if (
              (open_tag.ClassName == this.block_class_name)
              ||
              (open_tag.ClassName == this.inline_class_name)
            )  {
              var end_pos = pos + tag.length - 1;
              html = html.remove(pos - '</code>'.length, end_pos);
            }

            stack.pop();
          }
        } else { // 開きタグ
          var class_name = this.get_class_name(tag);

          stack.push({
            'TagName': tag_name, 
            'ClassName': class_name 
          });
        }

        pos += tag.length - 1;
      }

      pos += 1;
    }

    html = html.replace(new RegExp(this.block_open_tag  + '<code>', 'g'), '');
    html = html.replace(new RegExp(this.inline_open_tag + '<code>', 'g'), '');

    return html;
  }

}
