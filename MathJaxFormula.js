export default class MathJaxFormula {
  constructor() {
    this.block_open_tag   = '<code class="mathjax-formula">`';
    this.block_close_tag  = '`</code>';
    this.inline_open_tag  = '<code class="mathjax-formula">`';
    this.inline_close_tag = '`</code>';
  }

  // todo: ignore in `~~~` code span & ```~~~``` code block
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

    var last_pos = -1;
 
    while (pos < markdown.length) {
      if (markdown[pos] == '`' && not_escaped()) {
        if (flag_in_code) { // コード内
          var p = pos;
          for (var i = 0; p < markdown.length && i < code_quote_num; i += 1) {
            if(markdown[p] != '`') break;
            p += 1;
          }
          if ((p - pos) == code_quote_num) {
            flag_in_code = false;
            code_quote_num = 0;
          }
          pos = p;
        } else {
          flag_in_code = true;
          var p = pos;
          while (p < markdown.length && markdown[p] == '`') {
            p += 1;
          }
          code_quote_num = p - pos;
          pos = p;
        }
      } else if (markdown[pos] == '$' && not_escaped()) {
        if (flag_in_code) { // コード内
          // 何もしない
        } else if (flag_in_formula) { // 数式モード内
          if (flag_block_formula) {
            if (double_dollar()) {
              markdown = markdown.insert(pos + 2, this.block_close_tag);
              pos += this.block_close_tag.length + 1;
 
              flag_in_formula = false;
              flag_block_formula = false;
            }
          } else {
            markdown = markdown.insert(pos + 1, this.inline_close_tag);
            pos += this.inline_close_tag.length;

            flag_in_formula = false;
            flag_block_formula = false;
          }
        } else {
          flag_in_formula = true;
          last_pos = pos;
          
          if (double_dollar()) {
            markdown = markdown.insert(pos, this.block_open_tag);
            pos += this.block_open_tag.length + 1;
            flag_block_formula = true;
          } else {
            markdown = markdown.insert(pos, this.inline_open_tag);
            pos += this.inline_open_tag.length;
            flag_block_formula = false;
          }
        }
      }

      pos += 1;
    }

    if (flag_in_formula) {
      if (flag_block_formula) {
        markdown = markdown.insert(last_pos + this.block_open_tag.length  + 2, '$$' + this.blockclose_tag);
      } else {
        markdown = markdown.insert(last_pos + this.inline_open_tag.length + 1, '$'  + this.inline_close_tag);
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

    while (pos < html.length) {
      if (html[pos] == '<') {
        var start_pos = pos;
        var tag = '';
        
        var end_pos = pos + 1;
        while (end_pos < html.length && html[end_pos] != '>') {
          tag += html[end_pos];
          end_pos += 1;
        }

        var tag_name = tag.split(' ')[0];
        
        if (tag_name.startsWith('/')) {
          var open_tag = stack[stack.length - 1];
          if ('/' + open_tag.TagName == tag_name) {
            if (open_tag.ClassName == '"mathjax-formula"') {
              html = html.remove(start_pos - '</code>'.length, end_pos);
              if (open_tag.TagName == 'pre') {
                end_pos -= this.block_close_tag.length + '</code>'.length;
              } else {
                end_pos -= this.inline_close_tag.length + '</code>'.length;
              }
            }

            stack.pop();
          }
        } else {
          var class_name = '';
          tag.split(' ').forEach(function(s){
            var a = s.split('=');
            if (a[0].startsWith('class')) {
              class_name = a[1];
            }
          });

          stack.push({
            'TagName': tag_name, 
            'ClassName': class_name, 
            'StartPosition': start_pos,
            'EndPosition': end_pos
          });
        }

        pos = end_pos;
      }

      pos += 1;
    }

    html = html.replace(/<pre class=\"mathjax-formula\"><code>/g, '');
    html = html.replace(/<code class=\"mathjax-formula\"><code>/g, '');

    return html;
  }
}
