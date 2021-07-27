import { on, off } from 'element-ui/src/utils/dom';
import { renderThumbStyle, BAR_MAP } from './util';

/* istanbul ignore next */
export default {
  name: 'Bar',

  props: {
    vertical: Boolean,
    size: String,
    move: Number,
    scale: {
      type: Number,
      default: 1
    }
  },

  computed: {
    bar() {
      return BAR_MAP[this.vertical ? 'vertical' : 'horizontal'];
    },

    wrap() {
      return this.$parent.wrap;
    }
  },

  render(h) {
    const { size, move, bar } = this;

    return (
      <div
        class={['el-scrollbar__bar', 'is-' + bar.key]}
        onMousedown={this.clickTrackHandler} >
        <div
          ref="thumb"
          class="el-scrollbar__thumb"
          onMousedown={this.clickThumbHandler}
          style={renderThumbStyle({ size, move, bar })}>
        </div>
      </div>
    );
  },

  methods: {
    clickThumbHandler(e) {
      // prevent click event of right button
      if (e.ctrlKey || e.button === 2) {
        return;
      }
      this.startDrag(e);
      /**
       * this.bar.axis   Y
       * this.bar.offset   offsetHeight     height + padding * 2 + border * 2
       * e.currentTarget[this.bar.offset]  当前滑块的真实高度
       * this.bar.client   clientY
       * e[this.bar.client]   点击的地方的clientY，点击的位置据视口的  Y 坐标
       * this.bar.direction   top
       * e.currentTarget.getBoundingClientRect()[this.bar.direction]  当前点击的元素的top
       * 
       * 当前点击的位置
       */
      this[this.bar.axis] = ((e.currentTarget[this.bar.offset] * this.scale) - (e[this.bar.client] - e.currentTarget.getBoundingClientRect()[this.bar.direction]));
    },

    clickTrackHandler(e) {
      // 点击滚动条 轨道时的方法，注释以纵向滚动为例
      /**
       * this.bar.direction     top
       * this.bar.client     clientY 
       * e.target.getBoundingClientRect() 相对于视窗的位置集合
       * 
       * 滚动条 轨道相对于窗口的top值  减去点击的地方相对于可视区域的clientY高度值
       * 即 offset 为 点击的地方相对于轨道顶端的位置
       */
      const offset = Math.abs(e.target.getBoundingClientRect()[this.bar.direction] - e[this.bar.client]);
      /**
       * this.bar.offset   offsetHeight   height + padding * 2 + border * 2
       * this.$refs.thumb   ref中滑块的 dom 元素
       * 
       * thumbHalf就是 height / 2 + padding + border
       * 
       * 这个地方不是thumb缩放后的offsetHeight 而是真实的offsetHeight，需要乘以缩放的比例
       */
      const thumbHalf = ((this.$refs.thumb[this.bar.offset] * this.scale) / 2);
      /**
       * this.bar.offset   offsetHeight   height + padding * 2 + border * 2
       * this.$el  当前滚动条元素
       * 
       * this.$el[this.bar.offset] 指的是当前滚动条元素的 offsetHeight 为真实的高度，需要乘以缩放的比例
       */
      const thumbPositionPercentage = ((offset - thumbHalf) * 100 / (this.$el[this.bar.offset] * this.scale));
      /**
       * this.bar.scrollSize    scrollHeight  整个元素的高度
       * this.wrap[this.bar.scrollSize]  当前可滚动区域的高度，包括overflow的部分
       */
      this.wrap[this.bar.scroll] = (thumbPositionPercentage * this.wrap[this.bar.scrollSize] / 100);
    },

    startDrag(e) {
      e.stopImmediatePropagation();
      this.cursorDown = true;

      on(document, 'mousemove', this.mouseMoveDocumentHandler);
      on(document, 'mouseup', this.mouseUpDocumentHandler);
      document.onselectstart = () => false;
    },

    mouseMoveDocumentHandler(e) {
      // 移动滑块的方法，注释以纵向滚动为例
      if (this.cursorDown === false) return;
      /**
       * this.bar.axis  Y
       */
      const prevPage = this[this.bar.axis];
      if (!prevPage) return;
      /**
       * this.bar.direction     top
       * this.bar.client     clientY 
       * e.target.getBoundingClientRect() 相对于视窗的位置集合
       * 
       * 滚动条 轨道相对于窗口的top值  减去点击的地方相对于可视区域的clientY高度值
       * 即 offset 为 滑动到的位置相对于 滑道的位置
       */
      const offset = ((this.$el.getBoundingClientRect()[this.bar.direction] - e[this.bar.client]) * -1);
      /**
       * this.bar.offset   offsetHeight   height + padding * 2 + border * 2
       * this.$refs.thumb   ref中滑块的 dom 元素
       * 
       * 这个地方不是thumb缩放后的offsetHeight 而是真实的offsetHeight，需要乘以缩放的比例
       */
      const thumbClickPosition = (this.$refs.thumb[this.bar.offset] * this.scale - prevPage);
      /**
       * this.bar.offset   offsetHeight   height + padding * 2 + border * 2
       * 
       * this.$el[this.bar.offset] 指的是当前滚动条元素的 offsetHeight 为真实的高度，需要乘以缩放的比例
       */
      const thumbPositionPercentage = ((offset - thumbClickPosition) * 100 / (this.$el[this.bar.offset] * this.scale));
      /**
       * this.bar.scrollSize    scrollHeight  整个元素的高度
       * this.wrap[this.bar.scrollSize]  当前可滚动区域的高度，包括overflow的部分
       */
      this.wrap[this.bar.scroll] = (thumbPositionPercentage * this.wrap[this.bar.scrollSize] / 100);
    },

    mouseUpDocumentHandler(e) {
      this.cursorDown = false;
      this[this.bar.axis] = 0;
      off(document, 'mousemove', this.mouseMoveDocumentHandler);
      document.onselectstart = null;
    }
  },

  destroyed() {
    off(document, 'mouseup', this.mouseUpDocumentHandler);
  }
};
