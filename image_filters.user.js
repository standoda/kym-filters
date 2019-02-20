// ==UserScript==
// @name         Image Filtering
// @version      0.1
// @description  Filter images in photo galleries based on entry/user
// @author       e
// @match        https://knowyourmeme.com/*photos*
// @match        https://knowyourmeme.com/search/*
// @match        https://knowyourmeme.com/memes/*
// @match        https://knowyourmeme.com/users/*
// @match        https://knowyourmeme.com/search*
// @exclude      https://knowyourmeme.com/users/*/photos
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// @noframes
// ==/UserScript==

var $ = unsafeWindow.jQuery;
var entryFilter = GM_getValue('entryFilter', '');
var userFilter = GM_getValue('userFilter', '');
var moveFiltered = GM_getValue('moveFiltered', true);
var filteredCount = 0;
var currentItem = $('#photo_gallery .item').first();
var U = 'Uploaded by';
var isNotEntry = !Boolean($('#section_header h1').find('a').length);
console.log(entryFilter);
console.log(userFilter);

function filterPictures() {
    var lastLoadedItem = $('#infscr-loading').next();
    currentItem = lastLoadedItem.length ? lastLoadedItem : currentItem;
    //console.log(currentItem);
    var needUpdate = false;
    while (currentItem.length) {
        var nextItem = currentItem.next();
        if (currentItem.hasClass('item')){
            var item = currentItem.find('a');
            var entry = item.attr('href').replace(/^[^-]*-/, '');
            var user = item.find('.c').text();
            user = user.slice(user.indexOf(U) + U.length);
            user = user.substring(1, user.length -1).replace(/\n/g, ' ');;
            //console.log(user);
            if (entry) {
                if (entryFilter.indexOf('|' + entry + '|') >= 0 && isNotEntry ||
                    userFilter.indexOf('|' + user + '|') >= 0)
                {
                    if (moveFiltered) moveToFiltered(item);
                    msnry.remove(currentItem);
                    ++filteredCount;
                    needUpdate = true;
                }
            }
        }
        currentItem = nextItem;
    }
    if (needUpdate) {
        // update the grid with layout() but first temporarily disable the
        // event handler so we don't enter an infinite loop
        msnry.off('layoutComplete', filterPictures);
        msnry.layout();
        msnry.on('layoutComplete', filterPictures);
        $('#filter_open').text('(' + filteredCount + ') Images Filtered');
    }
}

// copy the filtered picture to the hidden gallery
function moveToFiltered(pic) {
    var filteredItem = $('<a/>', {
        'href': pic.attr('href'),
        'class':'fthumb',
        'target': '_blank'
    });
    var filteredImage = $('<img/>', {
        'src':    pic.children().attr('data-src'),
        'height': pic.children().attr('height'),
        'width':  pic.children().attr('width')
    });

    var filteredInfo = $('<div/>', {
        'class':'finfo'
    });

    filteredInfo.append(pic.find('.c').html());
    filteredItem.append(filteredImage);
    filteredItem.append(filteredInfo);
    $('#filtered_gallery').append(filteredItem);
}

function appendMenu() {
    var overlay = `
        <style>
        .open-button {
          background-color: #555;
          color: white;
          padding: 16px 20px;
          border: none;
          cursor: pointer;
          opacity: 0.8;
          position: fixed;
          bottom: 23px;
          right: 28px;
          width: 300px;
          z-index: 8;
        }

        .form-popup {
          display: none;
          position: fixed;
          width: 300px;
          bottom: 0;
          right: 15px;
          border: 3px solid #f1f1f1;
          z-index: 9;
          padding: 10px;
          background-color: white;
        }

        .form-popup .btn {
          background-color: #4CAF50;
          color: white;
          padding: 16px 20px;
          border: none;
          cursor: pointer;
          width: 100%;
          margin-bottom:10px;
          opacity: 0.8;
        }

        .form-popup .cancel {
          background-color: red;
        }

        .form-popup .btn:hover, .open-button:hover {
          opacity: 1;
        }

        .fthumb {
          display: flex;
          flex-direction: row;
          margin-bottom: 3px;
        }

        .finfo {
          background: rgba(0,0,0,0.75);
          padding: 11px 8px;
          width: 135px;
          font-size: 1.1em;
          line-height: 1.3em;
          color: #f0f0f0;
        }

        </style>

        <button id = "filter_open" class="open-button" onclick='document.getElementById("myForm").style.display = "block";'>Images Filtered</button>

        <div class="form-popup" id="myForm">
            <h3 style = "text-align: center; margin-bottom: 5px" >Filtered Images</h3>
            <div class="" id="filtered_gallery" style="overflow-y: scroll; width: 100%; height: 400px; margin-bottom: 10px"> </div>

            <div id = "textarea_filters" style = "display:none; width: 100%; margin-top: 10px">
            <p id = "p_entry_filter" style = "text-align: center"><b>Entry filters</b></p>
            <textarea id = "entry_filter" rows="6" style="width: 100%; height: 100%; resize: none;"></textarea>
            <p id = "p_user_filter" style = "text-align: center"><b>User filters</b></p>
            <textarea id = "user_filter" rows="6" style="width: 100%; height: 100%; resize: none;"></textarea>
            <input id="cbox_movepics" type="checkbox" style="width: 16px; height: 16px; margin-bottom: 15px;" checked>
            <label for="cbox_movepics" style="font-size: 14px;">Move filtered pictures here</label>

            <button id = "save_filters" class="btn">✓ Save filters</button>
            </div>

            <button id = "show_filters" class="btn">Show filters</button>
            <button type="button" class="btn cancel" onclick='document.getElementById("myForm").style.display = "none";'>Close</button>
        </div>`

    $('body').append(overlay);
    $('#entry_filter').val(entryFilter);
    $('#user_filter').val(userFilter);

    $('#save_filters').click(function() {
        GM_setValue('entryFilter', $('#entry_filter').val());
        GM_setValue('userFilter', $('#user_filter').val());
    });

    $('#show_filters').click(function() {
        $('#textarea_filters').slideToggle(200, function(){
            $('#show_filters').text( $(this).is(':visible') ? 'Hide filters' : 'Show filters');
        });
    });

    $('#cbox_movepics').prop("checked", moveFiltered)
    $('#cbox_movepics').change(function() {
        GM_setValue('moveFiltered', this.checked);
        moveFiltered = this.checked;
    });
}

var msnry = $('#photo_gallery').data('masonry');
if (msnry){
    appendMenu();
    //msnry.options.transitionDuration = '0.2s'
    msnry.on('layoutComplete', filterPictures);
    msnry.trigger('layoutComplete');
}

// append a button to entry pages to switch the filter on/off
var entryHeader = $('#maru .rel.c');
if (entryHeader.length){
    // check if entry was filtered already
    var entryToFilter = '|' + /[^/]*$/.exec(window.location.href)[0] + '|';
    var entryIndex = entryFilter.indexOf(entryToFilter);
    var entryIsFiltered = entryIndex >= 0;
    var entryBlockButton = $('<a/>', {
        'id':'filterbtn',
        'href': 'javascript:;',
        'class':'red button',
        'text': entryIsFiltered ? 'Remove from Filter' : 'Add to Filter',
        'style': 'margin-left: 10px'
    }).on('click', function(){
        entryFilter = GM_getValue('entryFilter', '');
        entryIndex = entryFilter.indexOf(entryToFilter);
        if (entryIndex >= 0) {
            entryFilter = entryFilter.substr(0, entryIndex + 1) +
                          entryFilter.substr(entryIndex + entryToFilter.length);
            if (entryFilter.length == 1) entryFilter = '';
            $(this).text('Add to Filter');
        } else {
            entryFilter += entryFilter.slice(-1) == '|' ? entryToFilter.substring(1) : entryToFilter;
            $(this).text('Remove from Filter');
        }
        GM_setValue('entryFilter', entryFilter);
    });
    entryHeader.prepend(entryBlockButton);
}

// append a button to user pages as well
var userHeader = $('#profile_info');
if (userHeader.length) {
    // check if user was filtered already
    var userToFilter = '|' + $('#profile_bio').find('h1').text() + '|';
    var userIndex = userFilter.indexOf(userToFilter);
    var userIsFiltered = userIndex >= 0;
    var userBlockButton = $('<a/>', {
        'id':'filterbtn',
        'href': 'javascript:;',
        'class':'red button',
        'text': userIsFiltered ? 'Remove from Filter' : 'Add to Filter',
        'style': 'margin-left: 24px'
    }).on('click', function() {
        userFilter = GM_getValue('userFilter', '');
        userIndex = userFilter.indexOf(userToFilter);
        if (userIndex >= 0) {
            userFilter = userFilter.substr(0, userIndex + 1) +
                         userFilter.substr(userIndex + userToFilter.length);
            if (userFilter.length == 1) userFilter = '';
            $(this).text('Add to Filter');
        } else {
            userFilter += userFilter.slice(-1) == '|' ? userToFilter.substring(1) : userToFilter;
            $(this).text('Remove from Filter');
        }
        GM_setValue('userFilter', userFilter);
    });
    userHeader.prepend(userBlockButton);
}
