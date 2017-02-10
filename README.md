# Drawatchio

Let's create beautiful monitoring console with draw.io!

## How To Use

Easy 7 steps to start monitoring!

1. Draw AWS infrastructure diagram using draw.io.
1. Create AWS Cognito identity pool.
1. Attach IAM policy for CloudWatch access to Cognito role.
1. Embed information for Cognito identity pool ID and CloudWatch parameters in diagram.
 * Right click target objects and click "Edit Data..." popup menu.
 * Add attribute for CloudWatch monitoring alarm or metric in draw objects.
    * Property name: dwio_AWSRegion
      * Value: AWS Cognito Region
    * Property name: dwio_IdentityPoolId
      * Value: Cognito Identity Pool ID
    * Property name: dwio_AlarmName
      * Value: CloudWatch AlarmName
    * Property name: dwio_MetricName
      * Value: IDName,ID,Namespace,MetricName,Statistics  ex: InstanceId,i-0f31c81ee0300xxxx,AWS/EC2,NetworkOut,Average
1. Disable autosave mode.
 * uncheck draw.io menu => Extras => Autosave
1. Set plugin to draw.io.
 * Click draw.io menu => Extras => Plugins...
 * Add following URLs and click Apply button.
 https://sdk.amazonaws.com/js/aws-sdk-2.7.20.min.js
 https://cdn.rawgit.com/yaggytter/drawatchio/dfb31691/web/js/drawatchio.js
1. Reload diagram page. And right click any objects and click "Start Monitoring" popup menu to start monitoring in draw.io.

![](https://github.com/yaggytter/drawatchio/blob/master/drawatchiodemo.gif?raw=true)

## Contributing

1. Fork it ( https://github.com/yaggytter/drawatchio/fork )
2. Create your feature branch (`git checkout -b new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin new-feature`)
5. Create a new Pull Request to develop branch
