/**
 * @author 0031
 * 在wenzhixin bootrap-table-export.js基础上结合实际场景做了自定义修改
 * 需要额外引入hhurz/tableExport.jquery.plugin.js#1.7.0 / abpetkov/switchery.js / t4t5/sweetalert.js
 */
(function ($) {
    'use strict';
    // bootstrapTable模板输出变量
    var sprintf = $.fn.bootstrapTable.utils.sprintf;

    // 定义可生成文件类型名称
    var TYPE_NAME = {
        csv: '.csv',
        excel: '.excel',
        sql: '.sql',
        xml: '.xml',
        json: '.json'
    };

    // 默认参数
    var defaults = {
        // 是否显示导出按钮
        showExport: false,
        // 文件导出格式
        exportTypes: ['excel', 'csv', 'sql', 'json', 'xml'],
        // 导出参数
        exportOptions: {
            minPageSize: 100,
            maxPageSize: 1000,
            pageSizeStep: 50,
            customPageSize: 300,
            // 开启自定义导出条数，导出文件前先执行该回调函数
            customExportTableCallback: function(){}
        }
    };

    // 默认关闭自定义导出
    var customExportFlag = false;
    // 正在导出数据对应的数据类型
    var isExporting = '';

    // 继承bootstrapTable.defaults/icons/locales参数
    $.extend($.fn.bootstrapTable.defaults, defaults);
    $.extend($.fn.bootstrapTable.defaults.icons, {
        export: 'fa fa-file-o'
    });
    $.extend($.fn.bootstrapTable.locales, {
        formatExport: function () {
            return '导出到文件';
        }
    });
    $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales);

    // 获取构造器与toolbar
    var BootstrapTable = $.fn.bootstrapTable.Constructor,
        _initToolbar = BootstrapTable.prototype.initToolbar;

    // 扩展toolbar
    BootstrapTable.prototype.initToolbar = function () {

        _initToolbar.apply(this, Array.prototype.slice.apply(arguments));

        // 显示按钮
        if (this.options.showExport) {
            // 找到dom元素
            var that = this,
                $btnGroup = this.$toolbar.find('>.btn-group'),
                $export = $btnGroup.find('div.export-data');

            // 如果该元素不存在，则新建
            if (!$export.length) {
                // 判断下拉列表是否打开状态
                // 文件是否正在导出状态
                var exporting = '', open = '';
                if (isExporting != '') {
                    open = ' open';
                    exporting = ' export-loading';
                }
                // 设置html内容box
                $export = $([
                    '<div class="export-data btn-group', open, exporting, '">',
                        '<button class="btn' +
                        sprintf(' btn-%s', this.options.buttonsClass) +
                        sprintf(' btn-%s', this.options.iconSize) +
                        ' dropdown-toggle"' +
                        'title="' + this.options.formatExport() + '" data-toggle="dropdown">',
                    sprintf('<i class="%s %s"></i> ', this.options.iconsPrefix, this.options.icons.export),
                    '<span class="caret"></span>',
                    '</button>',
                    '<ul class="dropdown-menu" role="menu" data-stop-propagation="true">',
                    '</ul>',
                    '</div>'].join('')).appendTo($btnGroup);

                var $menu = $export.find('.dropdown-menu'),
                    exportTypes = this.options.exportTypes;

                // 切割字符串类型的exportTypes
                if (typeof this.options.exportTypes === 'string') {
                    var types = this.options.exportTypes.slice(1, -1).replace(/ /g, '').split(',');
                    exportTypes = [];
                    $.each(types, function (i, value) {
                        exportTypes.push(value.slice(1, -1));
                    });
                }

                // 判断是否开启自定义导出开关，如果为true，显示 touch-spin-box，否则隐藏
                var checked = '', display = '';
                if (customExportFlag) {
                    checked = 'checked';
                } else {
                    display = 'style="display: none"';
                }
                // 加入自定义导出开关
                $menu.append([
                    '<li data-stop-propagation="true">',
                    '<div class="custom-export" title="开启此功能, 每页显示条数将切换为自定义值">',
                    '<span>自定义条数</span>&nbsp;&nbsp;',
                    '<input class="switchery custom-export-switch" type="checkbox"', checked, '>',
                    '</div>',
                    '</li>',
                    '<li class="change-custom-page-size" ', display, '>',
                    '<div class="touch-spin-box">',
                    '<div class="form-group">',
                    '<input class="touch-spin custom-page-size" type="text">',
                    '</div>',
                    '</li>'
                ].join(''));


                // 判断Switchery是否存在
                if (typeof Switchery == 'function') {
                    // 初始化switchery开关
                    new Switchery(document.querySelector('.export-data .switchery'), {size: 'small'});
                } else {
                    console.error('未引入abpetkov/switchery.js, 请检查代码.');
                }

                // 判断$.fn.TouchSpin是否存在
                if (typeof $.fn.TouchSpin == 'function') {
                    var $spin = $('input.custom-page-size');
                    // 扩展导出条数，如果值不存在，则取默认值
                    $spin.TouchSpin({
                        min: $.fn.bootstrapTable.defaults.exportOptions.minPageSize,        // 最小minPageSize条
                        max: $.fn.bootstrapTable.defaults.exportOptions.maxPageSize,        // 最大maxPageSize条
                        step: $.fn.bootstrapTable.defaults.exportOptions.pageSizeStep,      // pageSizeStep条递增
                        initval: $.fn.bootstrapTable.defaults.exportOptions.customPageSize, // 当前customPageSize条
                        buttondown_class: "btn btn-info",
                        buttonup_class: "btn btn-info"
                    });

                    // 绑定touchspin相关事件
                    // 值发生改变
                    $spin.on('change', function () {
                        $.fn.bootstrapTable.defaults.exportOptions.customPageSize = parseInt($(this).val());
                    });
                    // 最小值
                    $spin.on('touchspin.on.min', function () {
                        if (typeof swal == 'function') {
                            swal('抱歉', '不能再小啦.', 'warning');
                        } else {
                            console.log('未引入t4t5/sweetalert.js, 输出到控制台.');
                            console.warn('不能再小啦.');
                        }
                    });
                    // 最大值
                    $spin.on('touchspin.on.max', function () {
                        if (typeof swal == 'function') {
                            swal('抱歉', '为减小服务器压力, 每页最多只能导出' + $.fn.bootstrapTable.defaults.exportOptions.maxPageSize + '条数据.', 'warning');
                        } else {
                            console.log('未引入t4t5/sweetalert.js, 输出到控制台.');
                            console.warn('不能再小啦');
                        }
                    });
                    // 按下回车
                    $('.custom-page-size').on('keydown', function (e) {
                        if (e.keyCode == 13) {
                            // 让其失去焦点
                            $(this).blur();
                        }
                        // 阻止事件冒泡
                        e.stopImmediatePropagation();
                    });
                } else {
                    console.error('未引入istvan-ujjmeszaros/bootstrap-touchspin.js, 请检查代码.');
                }

                // 设置加载中函数
                var setLoading = function (type) {
                    isExporting = type;
                    var $btn = $('li[data-type=' + type + '] > a');
                    var loading = $btn.loading();
                    loading.btnLoading('正在生成' + $btn.html() + '文件&nbsp;<span class="loading dots"></span>');
                };
                // 设置加载完成函数
                var setLoaded = function (type) {
                    isExporting = '';
                    var $btn = $('li[data-type=' + type + '] > a');
                    var loading = $btn.loading();
                    loading.btnLoaded(1000, '生成完毕, 请保存.');
                };

                // 根据不同类型加入到下拉列表按钮
                $.each(exportTypes, function (i, type) {
                    var link = [
                        '<a href="javascript:;">',
                        TYPE_NAME[type],
                        '</a>'].join('');
                    // 生成li标签
                    if (TYPE_NAME.hasOwnProperty(type)) {
                        $menu.append(['<li data-type="' + type + '">',
                            link,
                            '</li>'].join(''));
                        // 触发加载事件
                        if (isExporting != '' && type == isExporting) {
                            setLoading(type);
                        }
                    }
                });

                // 下拉菜单a标签点击
                $menu.find('li > a').on('click', function () {
                    // 获取导出文件类型
                    var type = $(this).parent().data('type');
                    // 设置加载中
                    setLoading(type);
                    // 设置export-loading类
                    if (!$export.hasClass('export-loading')) {
                        $export.addClass('export-loading');
                    }
                    // 执行导出函数
                    var doExport = function () {
                        // 执行数据导出必须包含export-loading类
                        if ($export.hasClass('export-loading')) {
                            $export.removeClass('export-loading');
                            if (typeof that.$el.tableExport == 'function') {
                                that.$el.tableExport(
                                    $.extend({}, that.options.exportOptions, {
                                        type: type,
                                        escape: false
                                    })
                                );
                                // 加载完成
                                setLoaded(type);
                            } else {
                                console.error('hhurz/tableExport.jquery.plugin.js未引入, 请检查代码.')
                            }
                        }
                    };
                    if (customExportFlag) {
                        $spin.trigger('change');
                        // 自定义导出条数, 先加载数据, 再导出
                        if (typeof that.options.exportOptions.customExportTableCallback == 'function') {
                            that.options.exportOptions.customExportTableCallback(function () {
                                doExport()
                            });
                        } else {
                            console.warn('customExportTableCallback函数不存在, 自定义导出开关未生效.');
                        }
                    } else {
                        // 直接导出当前页
                        doExport()
                    }
                });

                // 下拉菜单自定义导出span点击
                $menu.find('.custom-export > span').eq(0).on('click', function () {
                    $('.custom-export-switch').trigger('click');
                });

                // 下拉菜单自定义导出开关发生变化
                $menu.find('.custom-export-switch').on('change', function () {
                    customExportFlag = $(this).get(0).checked;
                    var $li = $('.change-custom-page-size');
                    if (customExportFlag) {
                        $li.slideDown();
                        // 改变spin值
                        $spin.trigger('change');
                    } else {
                        $li.slideUp();
                    }
                });

                // 阻止下拉菜单关闭
                $('body').on('click','[data-stop-propagation]',function (e) {
                    e.stopImmediatePropagation();
                });

            }
        }
    };
})(jQuery);
