<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.js";
  let { value = $bindable(), disabled, ...restProps } = $props();

  const timezones = [
    {
      group: "",
      items: [{ value: "", label: "UTC" }],
    },
    {
      group: "Europe",
      items: [
        { value: "Europe/Amsterdam", label: "Amsterdam" },
        { value: "Europe/Andorra", label: "Andorra" },
        { value: "Europe/Athens", label: "Athens" },
        { value: "Europe/Belfast", label: "Belfast" },
        { value: "Europe/Belgrade", label: "Belgrade" },
        { value: "Europe/Berlin", label: "Berlin" },
        { value: "Europe/Bratislava", label: "Bratislava" },
        { value: "Europe/Brussels", label: "Brussels" },
        { value: "Europe/Bucharest", label: "Bucharest" },
        { value: "Europe/Budapest", label: "Budapest" },
        { value: "Europe/Chisinau", label: "Chisinau" },
        { value: "Europe/Copenhagen", label: "Copenhagen" },
        { value: "Europe/Dublin", label: "Dublin" },
        { value: "Europe/Gibraltar", label: "Gibraltar" },
        { value: "Europe/Guernsey", label: "Guernsey" },
        { value: "Europe/Helsinki", label: "Helsinki" },
        { value: "Europe/Isle_of_Man", label: "Isle of Man" },
        { value: "Europe/Istanbul", label: "Istanbul" },
        { value: "Europe/Jersey", label: "Jersey" },
        { value: "Europe/Kaliningrad", label: "Kaliningrad" },
        { value: "Europe/Kiev", label: "Kiev" },
        { value: "Europe/Lisbon", label: "Lisbon" },
        { value: "Europe/Ljubljana", label: "Ljubljana" },
        { value: "Europe/London", label: "London", selected: true },
        { value: "Europe/Luxembourg", label: "Luxembourg" },
        { value: "Europe/Madrid", label: "Madrid" },
        { value: "Europe/Malta", label: "Malta" },
        { value: "Europe/Mariehamn", label: "Mariehamn" },
        { value: "Europe/Minsk", label: "Minsk" },
        { value: "Europe/Monaco", label: "Monaco" },
        { value: "Europe/Moscow", label: "Moscow" },
        { value: "Europe/Nicosia", label: "Nicosia" },
        { value: "Europe/Oslo", label: "Oslo" },
        { value: "Europe/Paris", label: "Paris" },
        { value: "Europe/Podgorica", label: "Podgorica" },
        { value: "Europe/Prague", label: "Prague" },
        { value: "Europe/Riga", label: "Riga" },
        { value: "Europe/Rome", label: "Rome" },
        { value: "Europe/Samara", label: "Samara" },
        { value: "Europe/San_Marino", label: "San Marino" },
        { value: "Europe/Sarajevo", label: "Sarajevo" },
        { value: "Europe/Simferopol", label: "Simferopol" },
        { value: "Europe/Skopje", label: "Skopje" },
        { value: "Europe/Sofia", label: "Sofia" },
        { value: "Europe/Stockholm", label: "Stockholm" },
        { value: "Europe/Tallinn", label: "Tallinn" },
        { value: "Europe/Tirane", label: "Tirane" },
        { value: "Europe/Tiraspol", label: "Tiraspol" },
        { value: "Europe/Uzhgorod", label: "Uzhgorod" },
        { value: "Europe/Vaduz", label: "Vaduz" },
        { value: "Europe/Vatican", label: "Vatican" },
        { value: "Europe/Vienna", label: "Vienna" },
        { value: "Europe/Vilnius", label: "Vilnius" },
        { value: "Europe/Volgograd", label: "Volgograd" },
        { value: "Europe/Warsaw", label: "Warsaw" },
        { value: "Europe/Zagreb", label: "Zagreb" },
        { value: "Europe/Zaporozhye", label: "Zaporozhye" },
        { value: "Europe/Zurich", label: "Zurich" },
      ],
    },
    {
      group: "Africa",
      items: [
        { value: "Africa/Abidjan", label: "Abidjan" },
        { value: "Africa/Accra", label: "Accra" },
        { value: "Africa/Addis_Ababa", label: "Addis Ababa" },
        { value: "Africa/Algiers", label: "Algiers" },
        { value: "Africa/Asmara", label: "Asmara" },
        { value: "Africa/Asmera", label: "Asmera" },
        { value: "Africa/Bamako", label: "Bamako" },
        { value: "Africa/Bangui", label: "Bangui" },
        { value: "Africa/Banjul", label: "Banjul" },
        { value: "Africa/Bissau", label: "Bissau" },
        { value: "Africa/Blantyre", label: "Blantyre" },
        { value: "Africa/Brazzaville", label: "Brazzaville" },
        { value: "Africa/Bujumbura", label: "Bujumbura" },
        { value: "Africa/Cairo", label: "Cairo" },
        { value: "Africa/Casablanca", label: "Casablanca" },
        { value: "Africa/Ceuta", label: "Ceuta" },
        { value: "Africa/Conakry", label: "Conakry" },
        { value: "Africa/Dakar", label: "Dakar" },
        { value: "Africa/Dar_es_Salaam", label: "Dar es Salaam" },
        { value: "Africa/Djibouti", label: "Djibouti" },
        { value: "Africa/Douala", label: "Douala" },
        { value: "Africa/El_Aaiun", label: "El Aaiun" },
        { value: "Africa/Freetown", label: "Freetown" },
        { value: "Africa/Gaborone", label: "Gaborone" },
        { value: "Africa/Harare", label: "Harare" },
        { value: "Africa/Johannesburg", label: "Johannesburg" },
        { value: "Africa/Kampala", label: "Kampala" },
        { value: "Africa/Khartoum", label: "Khartoum" },
        { value: "Africa/Kigali", label: "Kigali" },
        { value: "Africa/Kinshasa", label: "Kinshasa" },
        { value: "Africa/Lagos", label: "Lagos" },
        { value: "Africa/Libreville", label: "Libreville" },
        { value: "Africa/Lome", label: "Lome" },
        { value: "Africa/Luanda", label: "Luanda" },
        { value: "Africa/Lubumbashi", label: "Lubumbashi" },
        { value: "Africa/Lusaka", label: "Lusaka" },
        { value: "Africa/Malabo", label: "Malabo" },
        { value: "Africa/Maputo", label: "Maputo" },
        { value: "Africa/Maseru", label: "Maseru" },
        { value: "Africa/Mbabane", label: "Mbabane" },
        { value: "Africa/Mogadishu", label: "Mogadishu" },
        { value: "Africa/Monrovia", label: "Monrovia" },
        { value: "Africa/Nairobi", label: "Nairobi" },
        { value: "Africa/Ndjamena", label: "Ndjamena" },
        { value: "Africa/Niamey", label: "Niamey" },
        { value: "Africa/Nouakchott", label: "Nouakchott" },
        { value: "Africa/Ouagadougou", label: "Ouagadougou" },
        { value: "Africa/Porto-Novo", label: "Porto-Novo" },
        { value: "Africa/Sao_Tome", label: "Sao Tome" },
        { value: "Africa/Timbuktu", label: "Timbuktu" },
        { value: "Africa/Tripoli", label: "Tripoli" },
        { value: "Africa/Tunis", label: "Tunis" },
        { value: "Africa/Windhoek", label: "Windhoek" },
      ],
    },
    {
      group: "America",
      items: [
        { value: "America/Adak", label: "Adak" },
        { value: "America/Anchorage", label: "Anchorage" },
        { value: "America/Anguilla", label: "Anguilla" },
        { value: "America/Antigua", label: "Antigua" },
        { value: "America/Araguaina", label: "Araguaina" },
        {
          value: "America/Argentina/Buenos_Aires",
          label: "Argentina (Buenos Aires)",
        },
        {
          value: "America/Argentina/Catamarca",
          label: "Argentina (Catamarca)",
        },
        {
          value: "America/Argentina/ComodRivadavia",
          label: "Argentina (ComodRivadavia)",
        },
        { value: "America/Argentina/Cordoba", label: "Argentina (Cordoba)" },
        { value: "America/Argentina/Jujuy", label: "Argentina (Jujuy)" },
        { value: "America/Argentina/La_Rioja", label: "Argentina (La Rioja)" },
        { value: "America/Argentina/Mendoza", label: "Argentina (Mendoza)" },
        {
          value: "America/Argentina/Rio_Gallegos",
          label: "Argentina (Rio Gallegos)",
        },
        { value: "America/Argentina/Salta", label: "Argentina (Salta)" },
        { value: "America/Argentina/San_Juan", label: "Argentina (San Juan)" },
        { value: "America/Argentina/San_Luis", label: "Argentina (San Luis)" },
        { value: "America/Argentina/Tucuman", label: "Argentina (Tucuman)" },
        { value: "America/Argentina/Ushuaia", label: "Argentina (Ushuaia)" },
        { value: "America/Aruba", label: "Aruba" },
        { value: "America/Asuncion", label: "Asuncion" },
        // Add more options here...
      ],
    },
    {
      group: "Antarctica",
      items: [
        { value: "Antarctica/Casey", label: "Casey" },
        { value: "Antarctica/Davis", label: "Davis" },
        { value: "Antarctica/DumontDUrville", label: "DumontDUrville" },
        { value: "Antarctica/Mawson", label: "Mawson" },
        { value: "Antarctica/McMurdo", label: "McMurdo" },
        { value: "Antarctica/Palmer", label: "Palmer" },
        { value: "Antarctica/Rothera", label: "Rothera" },
        { value: "Antarctica/South_Pole", label: "South Pole" },
        { value: "Antarctica/Syowa", label: "Syowa" },
        { value: "Antarctica/Vostok", label: "Vostok" },
      ],
    },
    {
      group: "Arctic",
      items: [{ value: "Arctic/Longyearbyen", label: "Longyearbyen" }],
    },
    {
      group: "Asia",
      items: [
        { value: "Asia/Aden", label: "Aden" },
        { value: "Asia/Almaty", label: "Almaty" },
        { value: "Asia/Amman", label: "Amman" },
        { value: "Asia/Anadyr", label: "Anadyr" },
        { value: "Asia/Aqtau", label: "Aqtau" },
        { value: "Asia/Aqtobe", label: "Aqtobe" },
        { value: "Asia/Ashgabat", label: "Ashgabat" },
        { value: "Asia/Ashkhabad", label: "Ashkhabad" },
        { value: "Asia/Baghdad", label: "Baghdad" },
        { value: "Asia/Bahrain", label: "Bahrain" },
        { value: "Asia/Baku", label: "Baku" },
        { value: "Asia/Bangkok", label: "Bangkok" },
        { value: "Asia/Beirut", label: "Beirut" },
        { value: "Asia/Bishkek", label: "Bishkek" },
        { value: "Asia/Brunei", label: "Brunei" },
        { value: "Asia/Calcutta", label: "Calcutta" },
        // Add the rest of the options in a similar manner
      ],
    },
    {
      group: "Atlantic",
      items: [
        { value: "Atlantic/Azores", label: "Azores" },
        { value: "Atlantic/Bermuda", label: "Bermuda" },
        { value: "Atlantic/Canary", label: "Canary" },
        // Add the rest of the options in a similar manner
      ],
    },
    {
      group: "Australia",
      items: [
        { value: "Australia/ACT", label: "ACT" },
        { value: "Australia/Adelaide", label: "Adelaide" },
        { value: "Australia/Brisbane", label: "Brisbane" },
        // Add the rest of the options in a similar manner
      ],
    },
    {
      group: "Indian",
      items: [
        { value: "Indian/Antananarivo", label: "Antananarivo" },
        { value: "Indian/Chagos", label: "Chagos" },
        { value: "Indian/Christmas", label: "Christmas" },
        { value: "Indian/Cocos", label: "Cocos" },
        { value: "Indian/Comoro", label: "Comoro" },
        { value: "Indian/Kerguelen", label: "Kerguelen" },
        { value: "Indian/Mahe", label: "Mahe" },
        { value: "Indian/Maldives", label: "Maldives" },
        { value: "Indian/Mauritius", label: "Mauritius" },
        { value: "Indian/Mayotte", label: "Mayotte" },
        { value: "Indian/Reunion", label: "Reunion" },
      ],
    },
    {
      group: "Pacific",
      items: [
        { value: "Pacific/Apia", label: "Apia" },
        { value: "Pacific/Auckland", label: "Auckland" },
        { value: "Pacific/Chatham", label: "Chatham" },
        { value: "Pacific/Easter", label: "Easter" },
        { value: "Pacific/Efate", label: "Efate" },
        { value: "Pacific/Enderbury", label: "Enderbury" },
        { value: "Pacific/Fakaofo", label: "Fakaofo" },
        { value: "Pacific/Fiji", label: "Fiji" },
        { value: "Pacific/Funafuti", label: "Funafuti" },
        { value: "Pacific/Galapagos", label: "Galapagos" },
        { value: "Pacific/Gambier", label: "Gambier" },
        { value: "Pacific/Guadalcanal", label: "Guadalcanal" },
        { value: "Pacific/Guam", label: "Guam" },
        { value: "Pacific/Honolulu", label: "Honolulu" },
        { value: "Pacific/Johnston", label: "Johnston" },
        { value: "Pacific/Kiritimati", label: "Kiritimati" },
        { value: "Pacific/Kosrae", label: "Kosrae" },
        { value: "Pacific/Kwajalein", label: "Kwajalein" },
        { value: "Pacific/Majuro", label: "Majuro" },
        { value: "Pacific/Marquesas", label: "Marquesas" },
        { value: "Pacific/Midway", label: "Midway" },
        { value: "Pacific/Nauru", label: "Nauru" },
        { value: "Pacific/Niue", label: "Niue" },
        { value: "Pacific/Norfolk", label: "Norfolk" },
        { value: "Pacific/Noumea", label: "Noumea" },
        { value: "Pacific/Pago_Pago", label: "Pago Pago" },
        { value: "Pacific/Palau", label: "Palau" },
        { value: "Pacific/Pitcairn", label: "Pitcairn" },
        { value: "Pacific/Ponape", label: "Ponape" },
        { value: "Pacific/Port_Moresby", label: "Port Moresby" },
        { value: "Pacific/Rarotonga", label: "Rarotonga" },
        { value: "Pacific/Saipan", label: "Saipan" },
        { value: "Pacific/Samoa", label: "Samoa" },
        { value: "Pacific/Tahiti", label: "Tahiti" },
        { value: "Pacific/Tarawa", label: "Tarawa" },
        { value: "Pacific/Tongatapu", label: "Tongatapu" },
        { value: "Pacific/Truk", label: "Truk" },
        { value: "Pacific/Wake", label: "Wake" },
        { value: "Pacific/Wallis", label: "Wallis" },
        { value: "Pacific/Yap", label: "Yap" },
      ],
    },
  ];

  const triggerContent = $derived(
    timezones.flatMap((group) => group.items).find((tz) => tz.value === value)
      ?.label ?? "Select a timezone",
  );
</script>

<Select.Root {disabled} {...restProps} type="single" name="timezone" bind:value>
  <Select.Trigger
    class="w-[180px] h-8 w-64 py-2 rounded-[10px] border dark:border-bw600 dark:placeholder-bw500 dark:text-bw400 dark:bg-bw800 focus:outline-none"
  >
    {triggerContent}
  </Select.Trigger>
  <Select.Content
    class="dark:bg-bw850 border dark:border-bw600 dark:text-bw100"
  >
    {#each timezones as group}
      <Select.Group>
        <Select.GroupHeading class="font-bold text-lg">
          {group.group}</Select.GroupHeading
        >
        {#each group.items as item}
          <Select.Item
            value={item.value}
            label={item.label}
            class={` ${value === item?.value && "border dark:border-bw600 dark:bg-bw700 "} rounded-[10px] dark:text-bw100`}
          >
            {item.label}
          </Select.Item>
        {/each}
      </Select.Group>
    {/each}
  </Select.Content>
</Select.Root>
